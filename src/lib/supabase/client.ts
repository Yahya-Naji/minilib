import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

// Simple no-op lock that bypasses Navigator LockManager
// Navigator LockManager hangs in some browsers (especially incognito mode)
const noopLock = async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn();
};

export function createClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
    {
      auth: {
        lock: noopLock as any,
      },
    }
  );
  return client;
}
