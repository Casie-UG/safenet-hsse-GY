import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhdvyvmyxfycnsxbtwen.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZHZ5dm15eGZ5Y25zeGJ0d2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDc5MzMsImV4cCI6MjA2NzIyMzkzM30.-PgQJ5x36g8x2NBKvLZjY5jSN9i_vZs9z7h9b4mIQmk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
