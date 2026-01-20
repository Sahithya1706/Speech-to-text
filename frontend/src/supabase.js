import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zjttfhrakurwluvvrsjd.supabase.co";
const supabaseAnonKey = "sb_publishable_GDwnK2ISMbwvCQ4qS0JPEQ_sJcFADiv";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
