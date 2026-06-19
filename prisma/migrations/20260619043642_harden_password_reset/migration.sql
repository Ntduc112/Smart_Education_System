/*
  Warnings:

  - You are about to drop the column `code` on the `PasswordReset` table. All the data in the column will be lost.
  - Added the required column `code_hash` to the `PasswordReset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PasswordReset" DROP COLUMN "code",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "code_hash" TEXT NOT NULL;
