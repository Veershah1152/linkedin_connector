const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

// Admin client (bypasses RLS) — use only in backend services
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Public client (respects RLS) — use for user-scoped operations
const supabasePublic = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

module.exports = { supabaseAdmin, supabasePublic };
