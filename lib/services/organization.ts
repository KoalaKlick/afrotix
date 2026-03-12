/**
 * Organization Service
 * Server-side functions for managing organizations
 */

import { createClient } from '@/utils/supabase/server';
import { isReservedSlug } from '@/lib/validations/organization';
import type {
  Organization,
  OrganizationMember,
  OrganizationRole,
  Profile,
} from '@/lib/generated/prisma';

// Custom type for organization with members and their profiles
type OrganizationWithMembers = Organization & {
  members: (OrganizationMember & { profile: Profile })[];
};

/**
 * Create a new organization and add the creator as owner
 */
export async function createOrganization(
  data: {
    name: string;
    slug: string;
    description?: string | null;
    logo_url?: string | null;
    brand_color?: string;
    website_url?: string | null;
    contact_email?: string | null;
  },
  userId: string
): Promise<{ organization: Organization | null; error: Error | null }> {
  const supabase = await createClient();

  // Create the organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      ...data,
      created_by: userId,
    } as never)
    .select()
    .single();

  if (orgError || !organization) {
    return { organization: null, error: orgError };
  }

  const org = organization as Organization;

  // Add the creator as owner
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner',
    } as never);

  if (memberError) {
    // Rollback: delete the organization if we couldn't add the member
    await supabase.from('organizations').delete().eq('id', org.id);
    return { organization: null, error: memberError };
  }

  return { organization: org, error: null };
}

/**
 * Get an organization by ID with its members
 */
export async function getOrganizationWithMembers(
  organizationId: string
): Promise<OrganizationWithMembers | null> {
  const supabase = await createClient();

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (orgError || !organization) {
    return null;
  }

  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('organization_id', organizationId);

  if (membersError) {
    return null;
  }

  return {
    ...(organization as Organization),
    members: members as (OrganizationMember & { profile: Profile })[],
  };
}

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(
  userId: string
): Promise<(Organization & { role: OrganizationRole })[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      organization:organizations(*)
    `)
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return (data as unknown as Array<{ role: OrganizationRole; organization: Organization }>).map((item) => ({
    ...item.organization,
    role: item.role,
  }));
}

/**
 * Get user's role in an organization
 */
export async function getUserOrgRole(
  organizationId: string,
  userId: string
): Promise<OrganizationRole | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as { role: OrganizationRole }).role;
}

/**
 * Update an organization
 */
export async function updateOrganization(
  organizationId: string,
  updateData: Partial<Omit<Organization, 'id' | 'created_at'>>
): Promise<{ organization: Organization | null; error: Error | null }> {
  const supabase = await createClient();

  const { data: organization, error } = await supabase
    .from('organizations')
    .update(updateData as never)
    .eq('id', organizationId)
    .select()
    .single();

  return { organization, error };
}

/**
 * Add a member to an organization
 */
export async function addOrganizationMember(
  memberData: {
    organization_id: string;
    user_id: string;
    role?: OrganizationRole;
  }
): Promise<{ member: OrganizationMember | null; error: Error | null }> {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from('organization_members')
    .insert(memberData as never)
    .select()
    .single();

  return { member, error };
}

/**
 * Remove a member from an organization
 */
export async function removeOrganizationMember(
  organizationId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  return { error };
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: OrganizationRole
): Promise<{ error: Error | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organization_members')
    .update({ role } as never)
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  return { error };
}

/**
 * Check if a slug is available (not used by another org and not reserved)
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  // Check if slug is reserved for system routes
  if (isReservedSlug(slug)) {
    return false;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  return !data && !!error;
}

/**
 * Generate a unique slug from a name
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugAvailable(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
