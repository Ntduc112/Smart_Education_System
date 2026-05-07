-- CreateTable
CREATE TABLE "Wishlist" (
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("user_id","course_id")
);

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
