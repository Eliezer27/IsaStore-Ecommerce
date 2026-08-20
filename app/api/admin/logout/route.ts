import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const store = await cookies();
  store.delete(ADMIN_AUTH_COOKIE);
  return NextResponse.redirect(new URL("/admin-login", req.url));
}
