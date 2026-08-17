import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xnmhmgylqngdrjzzqmdi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubWhtZ3lscW5nZHJqenpxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MjcxMTEsImV4cCI6MjEwMjEwMzExMX0.1fzJ5K36gOf61V6O4-X8XbRkE00qxeUM5YFoYMLMIn4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const ATTACHMENTS_BUCKET = "prescription-attachments";
