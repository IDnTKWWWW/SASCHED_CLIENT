import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gtngkovrubgtnltfaqhh.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bmdrb3ZydWJndG5sdGZhcWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTU4MDEsImV4cCI6MjA5NDQzMTgwMX0.zQFU5A_wIun6VtvShOBz0itAs0j7YKRfQ-HS1QD7tso";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
