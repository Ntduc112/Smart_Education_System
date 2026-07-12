-- Trợ giảng giờ là account do giáo viên tạo sẵn → bỏ luồng mời PENDING/accept.
ALTER TABLE "User" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- Lời mời chưa nhận không còn ý nghĩa trong luồng mới.
DELETE FROM "CourseCollaborator" WHERE "status" = 'PENDING';

ALTER TABLE "CourseCollaborator"
    DROP COLUMN "can_answer_qa",
    DROP COLUMN "can_grade",
    DROP COLUMN "accepted_at";

-- Thu hẹp enum: bỏ giá trị PENDING (Postgres không xóa trực tiếp được giá trị enum).
CREATE TYPE "collaborator_status_new" AS ENUM ('ACTIVE', 'REVOKED');
ALTER TABLE "CourseCollaborator" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CourseCollaborator"
    ALTER COLUMN "status" TYPE "collaborator_status_new"
    USING "status"::text::"collaborator_status_new";
DROP TYPE "collaborator_status";
ALTER TYPE "collaborator_status_new" RENAME TO "collaborator_status";
ALTER TABLE "CourseCollaborator" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
