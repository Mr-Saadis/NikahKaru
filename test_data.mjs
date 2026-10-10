import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, created_by');
  
  if (pErr) {
    console.error("Error profiles:", pErr);
  } else {
    console.log("Profiles count:", profiles.length);
    if (profiles.length > 0) {
      console.log("Sample created_by:", profiles[0].created_by);
    }
  }

  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) {
    console.error("Error users:", uErr);
  } else {
    console.log("Users:", users.users.map(u => ({ id: u.id, email: u.email, role: u.user_metadata?.role })));
  }

  const { data: viewData, error: vErr } = await supabase
    .from('vw_profile_core')
    .select('profile_id, created_by, full_name');
  if (vErr) {
    console.error("Error view:", vErr);
  } else {
    console.log("View count:", viewData.length);
  }
}

check();
