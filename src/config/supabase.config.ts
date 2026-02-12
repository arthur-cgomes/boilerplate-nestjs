import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (
  configService: ConfigService,
): SupabaseClient | null => {
  const supabaseUrl = configService.get<string>('SUPABASE_URL');
  const supabaseAnonKey = configService.get<string>('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
};
