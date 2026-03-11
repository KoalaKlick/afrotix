import { logger } from '@/lib/logger';
/**
 * Profile Service
 * Server-side functions for managing user profiles
 */

import { createClient } from '@/utils/supabase/server';
import type { Profile } from '@/lib/generated/prisma';

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    logger.error('Error fetching profile:', error);
    return null;
  }

  return profile as Profile;
}

/**
 * Get a profile by user ID
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return profile;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(
  data: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<{ profile: Profile | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, error: new Error('Not authenticated') };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data as never)
    .eq('id', user.id)
    .select()
    .single();

  return { profile, error };
}

/**
 * Update onboarding progress
 */
export async function updateOnboardingStep(
  step: number,
  completed = false
): Promise<{ error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_step: step,
      onboarding_completed: completed,
    } as never)
    .eq('id', user.id);

  return { error };
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(): Promise<{ error: Error | null }> {
  return updateOnboardingStep(999, true);
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  return !data && !!error;
}

/**
 * Set username for profile
 */
export async function setUsername(
  username: string
): Promise<{ error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  // Check availability first
  const available = await isUsernameAvailable(username);
  if (!available) {
    return { error: new Error('Username is already taken') };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: username.toLowerCase() } as never)
    .eq('id', user.id);

  return { error };
}

/**
 * Get profile completion percentage
 */
export function getProfileCompletionPercentage(profile: Profile): number {
  const fields = [
    profile.username,
    profile.fullName,
    profile.avatarUrl,
  ];

  const filledFields = fields.filter((field) => field !== null && field !== '').length;
  return Math.round((filledFields / fields.length) * 100);
}
