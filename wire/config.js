/* ==========================================================================
   EAGLE WIRE — Supabase configuration
   --------------------------------------------------------------------------
   Fill in the two values below, then Eagle Wire reads from Supabase instead
   of articles.json. Leave SUPABASE_URL empty to keep using articles.json.

   Find both in your Supabase dashboard under Project Settings → API.
   The anon key is safe to ship publicly — Row Level Security is what
   protects the data, and the schema only lets anonymous visitors read
   published stories.
   ========================================================================== */

window.WIRE_CONFIG = {
  SUPABASE_URL: "",           // e.g. "https://abcdefghijkl.supabase.co"
  SUPABASE_ANON_KEY: "",      // the long "anon public" key
  OUTLET: "eagle-wire"
};
