// Khôi phục các tài khoản mà e2e/helpers.ts cần (upsert — không đụng dữ liệu khác).
// Dùng khi DB dev bị lệch (đổi mật khẩu, xóa account) làm E2E fail ở bước login.
// Chạy: npx tsx scripts/restore-e2e-accounts.ts
import "dotenv/config";
import prisma from "@/prisma/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const [adminPw, teacherPw, studentPw] = await Promise.all([
    bcrypt.hash("Admin@123", 10),
    bcrypt.hash("Teacher@123", 10),
    bcrypt.hash("Student@123", 10),
  ]);

  const accounts = [
    { name: "Admin System", email: "admin@learnust.vn", password_hash: adminPw, role: "ADMIN" as const },
    { name: "Nguyễn Văn An", email: "an.nguyen@learnust.vn", password_hash: teacherPw, role: "TEACHER" as const },
    { name: "Lê Văn Cường", email: "cuong@student.vn", password_hash: studentPw, role: "STUDENT" as const },
  ];

  for (const a of accounts) {
    const u = await prisma.user.upsert({
      where: { email: a.email },
      create: { ...a, must_change_password: false },
      update: { password_hash: a.password_hash, is_active: true, must_change_password: false },
    });
    console.log("OK:", u.email, u.role);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
