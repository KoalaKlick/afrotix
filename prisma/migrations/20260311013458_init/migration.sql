-- AlterTable
ALTER TABLE "organization_invitations" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '7 days';
