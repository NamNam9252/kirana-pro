-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('SALE', 'PURCHASE', 'DAMAGE', 'LOSS', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'CARD', 'CREDIT', 'OTHER');

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransactionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2),
    "unitPrice" DECIMAL(10,2),

    CONSTRAINT "InventoryTransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesBill" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "notes" TEXT,
    "subtotalAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesBillItem" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "SalesBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPayment" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "SalesPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryTransaction_shopId_idx" ON "InventoryTransaction"("shopId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_shopId_type_idx" ON "InventoryTransaction"("shopId", "type");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdByUserId_idx" ON "InventoryTransaction"("createdByUserId");

-- CreateIndex
CREATE INDEX "InventoryTransactionItem_transactionId_idx" ON "InventoryTransactionItem"("transactionId");

-- CreateIndex
CREATE INDEX "InventoryTransactionItem_inventoryItemId_idx" ON "InventoryTransactionItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransactionItem_transactionId_inventoryItemId_key" ON "InventoryTransactionItem"("transactionId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "SalesBill_shopId_idx" ON "SalesBill"("shopId");

-- CreateIndex
CREATE INDEX "SalesBill_shopId_status_idx" ON "SalesBill"("shopId", "status");

-- CreateIndex
CREATE INDEX "SalesBill_createdByUserId_idx" ON "SalesBill"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesBill_shopId_billNumber_key" ON "SalesBill"("shopId", "billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SalesBill_transactionId_key" ON "SalesBill"("transactionId");

-- CreateIndex
CREATE INDEX "SalesBillItem_billId_idx" ON "SalesBillItem"("billId");

-- CreateIndex
CREATE INDEX "SalesBillItem_inventoryItemId_idx" ON "SalesBillItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesBillItem_billId_inventoryItemId_key" ON "SalesBillItem"("billId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "SalesPayment_billId_idx" ON "SalesPayment"("billId");

-- CreateIndex
CREATE INDEX "SalesPayment_createdByUserId_idx" ON "SalesPayment"("createdByUserId");

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransactionItem" ADD CONSTRAINT "InventoryTransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "InventoryTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransactionItem" ADD CONSTRAINT "InventoryTransactionItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBill" ADD CONSTRAINT "SalesBill_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBill" ADD CONSTRAINT "SalesBill_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBill" ADD CONSTRAINT "SalesBill_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "InventoryTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillItem" ADD CONSTRAINT "SalesBillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "SalesBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillItem" ADD CONSTRAINT "SalesBillItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "SalesBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
