-- Conecta Supabase Auth (auth.users) con la tabla de la app (public.users).
--
-- Contexto: hasta ahora public.users era una tabla "sola", sin relación con
-- ningún sistema de login real (/admin usaba una sola contraseña compartida
-- por variable de entorno; /cuenta era pura maqueta). Ahora que se conecta
-- Supabase Auth de verdad, cada cuenta (cliente que se registra en /cuenta,
-- o staff/admin que el dueño invita desde /admin/usuarios) vive como fila en
-- auth.users (que administra Supabase, no nosotros). Este trigger copia esa
-- fila a public.users automáticamente, que es la tabla que sí lee el resto
-- de la app vía Prisma (reseñas, pedidos, etc. — todo lo que referencia
-- User.id ya asume que existe una fila en public.users).
--
-- El rol (customer | staff | admin) se lee de auth.users.raw_app_meta_data,
-- NUNCA de raw_user_meta_data: app_metadata solo lo puede escribir un
-- llamado con la Service Role Key (lib/supabase/admin.ts) — el usuario NO
-- puede editarlo por su cuenta (a diferencia de user_metadata, que sí es
-- editable por el propio usuario vía supabase.auth.updateUser). Si algún
-- día alguien intenta hacerse pasar por admin llamando updateUser({data:
-- {role: 'admin'}}) desde la consola del navegador, eso solo toca
-- user_metadata — este trigger lo ignora por completo para el rol.
--
-- CÓMO CORRER ESTA MIGRACIÓN: este sandbox no tiene salida de red hacia
-- Supabase, así que no se pudo aplicar acá. Desde tu máquina (con
-- DATABASE_URL apuntando a tu proyecto real):
--   npx prisma migrate deploy
-- o si preferís, pega este archivo completo en el SQL Editor de tu proyecto
-- de Supabase y ejecutalo ahí directamente — es SQL plano, no depende de la
-- CLI de Prisma para nada.

-- Limpieza única: borra cualquier fila vieja de public.users que haya
-- quedado del formulario "Nuevo usuario" original (creaba filas sueltas sin
-- password ni cuenta de Auth detrás, ver lib/admin/actions.ts createUser
-- previo a este cambio). Esas filas no corresponden a ninguna cuenta real
-- de Supabase Auth, así que sería imposible que alguien inicie sesión con
-- ellas de todas formas; se eliminan para que el email no choque con el
-- unique constraint cuando esa persona se registre de verdad.
delete from public.users u
where not exists (select 1 from auth.users a where a.id = u.id);

create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_app_meta_data ->> 'role', 'customer'),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do update
    set email      = excluded.email,
        role       = excluded.role,
        first_name = coalesce(excluded.first_name, public.users.first_name),
        last_name  = coalesce(excluded.last_name, public.users.last_name),
        updated_at = now();
  return new;
end;
$$;

-- Se dispara al crear la cuenta (signUp de cliente, o createUser de
-- staff/admin desde el dashboard)...
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_sync();

-- ...y también cuando cambia el rol o los metadatos después de creada: el
-- flujo de "crear staff" primero crea la cuenta (dispara el trigger de
-- arriba con role="customer" por defecto, porque el rol real todavía no se
-- ha puesto) y JUSTO DESPUÉS le asigna el app_metadata.role real con
-- updateUserById — eso es un UPDATE, no un INSERT, así que sin este segundo
-- trigger la fila en public.users se quedaría con "customer" para siempre.
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of raw_app_meta_data, raw_user_meta_data, email on auth.users
  for each row execute function public.handle_auth_user_sync();
