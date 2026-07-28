import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { supabase } from "./db"

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
}

export async function getWorkspaceId(req: NextRequest): Promise<string | null> {
  const apiKey = req.headers.get("x-api-key")
  if (apiKey) {
    const { data } = await supabase.from("api_keys").select("workspace_id").eq("key", apiKey).eq("revoked", false).maybeSingle()
    if (data) {
      supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key", apiKey).then()
      return data.workspace_id
    }
  }

  const supabaseClient = await createServerSupabase()
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from("users").select("workspace_id").eq("auth_id", user.id).maybeSingle()
  return data?.workspace_id || null
}

export async function requireWorkspace(req: NextRequest): Promise<string> {
  const id = await getWorkspaceId(req)
  if (!id) throw new Error("Unauthorized")
  return id
}

export async function getSessionUser() {
  const supabaseClient = await createServerSupabase()
  const { data: { user } } = await supabaseClient.auth.getUser()
  return user
}

export async function getUserRole(req: NextRequest): Promise<string | null> {
  const supabaseClient = await createServerSupabase()
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("users").select("role").eq("auth_id", user.id).maybeSingle()
  return data?.role || null
}

export async function adminGuard(req: NextRequest): Promise<boolean> {
  const role = await getUserRole(req)
  return role === "Admin"
}
