-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Shopkeeper" ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "kycDocumentUrl" TEXT,
ADD COLUMN     "kycStatus" "KycStatus",
ADD COLUMN     "kycVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "panNumber" TEXT;
