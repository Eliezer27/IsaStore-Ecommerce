-- Arregla un bug en el trigger de sincronización auth.users -> public.users
-- (creado en prisma/migrations/20260827060011_supabase_auth_sync).
--
-- EL BUG: la función original hacía
--   insert into public.users (...) values (...) on conflict (id) do update ...
-- "on conflict (id)" solo atrapa choques contra la PRIMARY KEY (id). Pero
-- public.users.email también es UNIQUE. Si alguien intenta registrarse (o
-- el admin crea una cuenta) con un correo que ya existe en public.users
-- bajo OTRO id — por ejemplo, una fila suelta de una prueba anterior, o un
-- registro viejo de antes de conectar Supabase Auth — el insert choca
-- contra el unique de email, que "on conflict (id)" no cubre, y Postgres
-- tira "duplicate key value violates unique constraint users_email_key".
-- Supabase Auth reporta ese error genérico como "Database error saving new
-- user", y como pasa DENTRO del trigger, aborta toda la operación: la
-- persona no puede registrarse ni el admin puede crear la cuenta, aunque
-- del lado de Auth todo esté bien.
--
-- EL FIX: antes de insertar, borrar cualquier fila de public.users que
-- tenga ese mismo email pero un id distinto — son filas huérfanas que no
-- corresponden a ninguna cuenta real de Supabase Auth de todas formas (si
-- correspondieran, el id sería el mismo). Después de eso, el insert de
-- siempre ya no puede chocar por email.
create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.users
  where email = new.email
    and id <> new.id;

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

-- No hace falta recrear los triggers (on_auth_user_created /
-- on_auth_user_updated): apuntan a esta función por nombre, así que ya
-- quedan usando la versión corregida en cuanto se corre este archivo.
