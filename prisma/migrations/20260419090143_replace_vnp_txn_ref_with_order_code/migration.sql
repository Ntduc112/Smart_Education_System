/*
  Warnings:

  - You are about to drop the column `vnp_txn_ref` on the `Payment` table. All the data in the column will be lost.
  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[order_code]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_code` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'FAILED');

-- DropIndex
DROP INDEX "Payment_vnp_txn_ref_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "vnp_txn_ref",
ADD COLUMN     "order_code" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "payment_status" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Payment_order_code_key" ON "Payment"("order_code");
