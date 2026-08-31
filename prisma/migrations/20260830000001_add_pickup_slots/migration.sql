-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "kidId" TEXT NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "label" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupSlot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "kidId" TEXT,
    "slotKey" TEXT NOT NULL,
    "timeMinutes" INTEGER NOT NULL,
    "assignedParentId" TEXT,
    "assignedParent2Id" TEXT,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickupSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parent_slug_key" ON "Parent"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_email_key" ON "Parent"("email");

-- CreateIndex
CREATE INDEX "Parent_kidId_idx" ON "Parent"("kidId");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PickupSlot_slotKey_key" ON "PickupSlot"("slotKey");

-- CreateIndex
CREATE INDEX "PickupSlot_date_idx" ON "PickupSlot"("date");

-- CreateIndex
CREATE INDEX "PickupSlot_assignedParentId_date_idx" ON "PickupSlot"("assignedParentId", "date");

-- CreateIndex
CREATE INDEX "PickupSlot_assignedParent2Id_date_idx" ON "PickupSlot"("assignedParent2Id", "date");

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "Kid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupSlot" ADD CONSTRAINT "PickupSlot_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "Kid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupSlot" ADD CONSTRAINT "PickupSlot_assignedParentId_fkey" FOREIGN KEY ("assignedParentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupSlot" ADD CONSTRAINT "PickupSlot_assignedParent2Id_fkey" FOREIGN KEY ("assignedParent2Id") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

