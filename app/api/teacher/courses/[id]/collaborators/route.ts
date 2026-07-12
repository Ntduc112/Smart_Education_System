import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendAssistantWelcomeEmail } from "@/lib/email/resend";

const CreateAssistantSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().trim().min(1, "Tên không được để trống").optional(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").optional(),
  can_manage_lessons: z.boolean().default(true),
  can_manage_quizzes: z.boolean().default(true),
}).refine((value) => value.can_manage_lessons || value.can_manage_quizzes, {
  message: "Cần cấp ít nhất một quyền",
});

async function ownedCourse(courseId: string, userId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, instructor_id: userId },
    select: { id: true, title: true, instructor: { select: { name: true } } },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const course = await ownedCourse(id, userId);
  if (!course) return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });

  const collaborators = await prisma.courseCollaborator.findMany({
    where: { course_id: id, status: "ACTIVE" },
    select: {
      id: true,
      status: true,
      can_manage_lessons: true,
      can_manage_quizzes: true,
      created_at: true,
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({ collaborators });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const input = CreateAssistantSchema.parse(await request.json());
    const course = await ownedCourse(id, userId);
    if (!course) return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });

    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, is_active: true },
    });

    // Email đã có account: chỉ chấp nhận account trợ giảng (do giáo viên khác tạo)
    // → gán thẳng vào khóa. Các role khác không dùng chung làm trợ giảng.
    if (existing && existing.role !== "TEACHING_ASSISTANT") {
      return NextResponse.json({ error: "Email đã thuộc tài khoản khác trên hệ thống" }, { status: 400 });
    }
    if (existing && !existing.is_active) {
      return NextResponse.json({ error: "Tài khoản trợ giảng này đã bị khóa" }, { status: 400 });
    }
    if (!existing && (!input.name || !input.password)) {
      return NextResponse.json({ error: "Cần nhập tên và mật khẩu để tạo tài khoản mới" }, { status: 400 });
    }

    let emailSent = false;
    const collaborator = await prisma.$transaction(async (tx) => {
      const assistantId = existing
        ? existing.id
        : (await tx.user.create({
            data: {
              name: input.name!,
              email,
              password_hash: await hashPassword(input.password!),
              role: "TEACHING_ASSISTANT",
              must_change_password: true,
            },
            select: { id: true },
          })).id;

      const membership = await tx.courseCollaborator.upsert({
        where: { course_id_user_id: { course_id: id, user_id: assistantId } },
        create: {
          course_id: id,
          user_id: assistantId,
          invited_by: userId,
          can_manage_lessons: input.can_manage_lessons,
          can_manage_quizzes: input.can_manage_quizzes,
        },
        update: {
          invited_by: userId,
          status: "ACTIVE",
          can_manage_lessons: input.can_manage_lessons,
          can_manage_quizzes: input.can_manage_quizzes,
          revoked_at: null,
        },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      });
      await tx.notification.create({
        data: {
          user_id: assistantId,
          type: "COURSE_ASSISTANT_ADDED",
          title: "Bạn được thêm làm trợ giảng",
          message: `Bạn đã trở thành trợ giảng của khóa học “${course.title}”.`,
          link: "/assistant/home",
        },
      });
      return membership;
    });

    // Account mới → gửi thông tin đăng nhập. Lỗi gửi mail không rollback account,
    // teacher vẫn có thể gửi mật khẩu cho trợ giảng theo cách khác.
    if (!existing) {
      try {
        await sendAssistantWelcomeEmail({
          email,
          name: input.name!,
          password: input.password!,
          courseTitle: course.title,
          teacherName: course.instructor.name,
          loginUrl: `${process.env.APP_URL ?? request.nextUrl.origin}/login`,
        });
        emailSent = true;
      } catch (error) {
        console.error("Error sending assistant welcome email:", error);
      }
    }

    return NextResponse.json({ collaborator, created: !existing, emailSent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
    }
    console.error("Error creating course assistant:", error);
    return NextResponse.json({ error: "Không thể thêm trợ giảng" }, { status: 500 });
  }
}
