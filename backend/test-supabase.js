const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Checking if users table exists and testing insert...");
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      linkedin_id: 'test_id_12345',
      email: 'test@example.com',
      full_name: 'Test User',
      profile_image_url: null,
      headline: null,
      linkedin_access_token: 'dummy_token',
      linkedin_token_expires_at: new Date().toISOString(),
      plan: 'free',
    })
    .select();

  if (error) {
    console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Inserted:", data);
    
    // Clean up
    await supabaseAdmin.from('users').delete().eq('linkedin_id', 'test_id_12345');
  }
}

test();
