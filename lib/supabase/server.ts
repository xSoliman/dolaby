import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let serviceClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client that bypasses row-level security. Used solely
 * by the read-only share API route, which validates the share token itself
 * before reading another user's wardrobe.
 */
export function getSupabaseServiceClient() {
  if (!url || !serviceRoleKey) return null;
  if (!serviceClient) {
    serviceClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serviceClient;
}

export const hasShareServiceConfig = Boolean(url && serviceRoleKey);
