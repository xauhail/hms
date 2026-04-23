const { createClient } = require('@supabase/supabase-js');

// Create a fresh admin client for each DB operation to ensure RLS is bypassed
// This client should ONLY be used for database operations, never for auth
function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }
    }
  );
}

// Export a singleton for backward compatibility, but recommend using createAdminClient()
const supabaseAdmin = createAdminClient();

module.exports = { supabaseAdmin, createAdminClient };
