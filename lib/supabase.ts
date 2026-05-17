import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const NOOP_RESULT = { data: null, error: null };

/** Chainable no-op that resolves to { data: null, error: null } for any method chain. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function noopQuery(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: any = {};
  const chainMethods = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'order', 'limit', 'single', 'maybeSingle', 'contains', 'or', 'in', 'is', 'filter'];
  for (const m of chainMethods) {
    self[m] = () => self;
  }
  self.then   = (resolve: (v: typeof NOOP_RESULT) => unknown) => Promise.resolve(NOOP_RESULT).then(resolve);
  self.catch  = (reject: (reason: unknown) => unknown) => Promise.resolve(NOOP_RESULT).catch(reject);
  return self;
}

function makeClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return {
      auth: {
        getSession:         async () => ({ data: { session: null }, error: null }),
        onAuthStateChange:  () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signUp:             async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut:            async () => ({ error: null }),
      },
      from: () => ({
        select: () => noopQuery(),
        insert: () => noopQuery(),
        update: () => noopQuery(),
        delete: () => noopQuery(),
        upsert: () => noopQuery(),
      }),
      storage: {
        from: () => ({
          upload:       async () => ({ data: null, error: null }),
          getPublicUrl: ()      => ({ data: { publicUrl: '' } }),
          remove:       async () => ({ data: null, error: null }),
        }),
      },
      rpc: () => noopQuery(),
    } as unknown as SupabaseClient;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = makeClient();
