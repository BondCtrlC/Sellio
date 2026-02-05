'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type AuthResult = {
  success: boolean;
  error?: string;
};

export async function login(data: LoginInput): Promise<AuthResult> {
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
    // Map Supabase errors to Thai messages
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(data: SignupInput): Promise<AuthResult> {
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
    return { success: false, error: 'Username นี้ถูกใช้งานแล้ว' };
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
      return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
