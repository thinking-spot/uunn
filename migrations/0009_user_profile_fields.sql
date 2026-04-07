-- Add profile fields to Users table
ALTER TABLE "Users" ADD COLUMN "location" TEXT;
ALTER TABLE "Users" ADD COLUMN "preferred_contact" TEXT;
