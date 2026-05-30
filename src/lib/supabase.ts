import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://srpvhptgobcbzzhmxbkj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycHZocHRnb2JjYnp6aG14YmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODQ5ODcsImV4cCI6MjA5NTY2MDk4N30.CDb6OACfbjpj8PxwJ_6wf3AQygvIj5LyVYwB3ylvHaQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getApiUrl = (endpoint: string) => {
  return `${supabaseUrl}/functions/v1/${endpoint}`;
};

export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${supabaseAnonKey}`,
});
