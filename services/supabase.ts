
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wpxquyedyjpfnsbfddcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweHF1eWVkeWpwZm5zYmZkZGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4Nzg2NzQsImV4cCI6MjA4MjQ1NDY3NH0.DN8o8wgMDa7pEdXQy6JC07j2gG_9AT7_0R_m_huZdN4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
