-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Employee', 'HR');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "password" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'Employee';
