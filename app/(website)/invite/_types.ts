export interface InviteDetails {
    id: string;
    email: string;
    role: string;
    expiresAt: Date | null;
    organization: {
        id: string;
        name: string;
        logoUrl: string | null;
        slug: string;
    };
    inviter: {
        fullName: string | null;
        avatarUrl: string | null;
    } | null;
}
