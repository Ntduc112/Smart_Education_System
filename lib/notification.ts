import prisma from "@/prisma/prisma";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  await prisma.notification.create({
    data: { user_id: userId, type, title, message, link },
  });
}
