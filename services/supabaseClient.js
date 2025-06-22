const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function getUserTokens(uid, service) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('uid', uid)
    .eq('service', service)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

module.exports = {
  supabase,
  getUserTokens,
};
