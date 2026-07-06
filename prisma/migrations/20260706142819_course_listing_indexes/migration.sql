-- CreateIndex
CREATE INDEX "Course_status_created_at_idx" ON "Course"("status", "created_at");

-- CreateIndex
CREATE INDEX "Course_status_category_id_idx" ON "Course"("status", "category_id");

-- CreateIndex
CREATE INDEX "Course_status_level_idx" ON "Course"("status", "level");

-- CreateIndex
CREATE INDEX "Course_status_price_idx" ON "Course"("status", "price");
