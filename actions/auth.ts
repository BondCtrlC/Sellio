'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { trackServerEvent } from '@/lib/posthog-server';

export type AuthResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
};

export async function login(data: LoginInput): Promise<AuthResult> {
  const t = await getTranslations('ServerActions');

  // Validate input
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Map Supabase errors to translated messages
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: t('invalidCredentials') };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(data: SignupInput): Promise<AuthResult> {
  const t = await getTranslations('ServerActions');

  // Validate input
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Check if username is already taken
  const { data: existingUser } = await supabase
    .from('creators')
    .select('username')
    .eq('username', parsed.data.username.toLowerCase())
    .single();

  if (existingUser) {
    return { success: false, error: t('usernameAlreadyUsed') };
  }

  // Create user
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username.toLowerCase(),
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: t('emailAlreadyUsed') };
    }
    return { success: false, error: error.message };
  }

  trackServerEvent(parsed.data.email, 'user_signed_up', {
    username: parsed.data.username.toLowerCase(),
  });

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
