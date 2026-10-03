import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log(data?.map(b => b.name));
}
check();
