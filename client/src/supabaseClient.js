import { createClient } from "@supabase/supabase-js";

// ต้องกำหนดค่าเหล่านี้ในไฟล์ .env (เช่น VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; 
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);