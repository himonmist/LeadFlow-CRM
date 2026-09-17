"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";

export async function markNotificationRead(notificationId: string) {
  const user = await requireTenantSession();
  await prisma.notification.update({ where: { id: notificationId, tenantId: user.tenantId, userId: user.id }, data: { isRead: true } });
  revalidatePath("/app/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireTenantSession();
  await prisma.notification.updateMany({ where: { tenantId: user.tenantId, userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/app/notifications");
}
