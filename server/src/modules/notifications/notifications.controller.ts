import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse, parsePagination, buildMeta } from '../../utils/apiResponse';

function formatNotification(n: any) {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.isRead,
    isRead: n.isRead,
    link: n.link,
    relatedEntityType: n.relatedEntityType,
    relatedEntityId: n.relatedEntityId,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { page, pageSize, skip } = parsePagination(req.query);
  const unreadOnly = req.query.unreadOnly === 'true';

  const where: any = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  successResponse(
    res,
    notifications.map(formatNotification),
    200,
    buildMeta(page, pageSize, total)
  );
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  successResponse(res, { unreadCount: count });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== userId) {
    errorResponse(res, 404, 'NOT_FOUND', 'Notification not found');
    return;
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  successResponse(res, formatNotification(updated));
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  successResponse(res, { success: true });
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== userId) {
    errorResponse(res, 404, 'NOT_FOUND', 'Notification not found');
    return;
  }

  await prisma.notification.delete({ where: { id } });

  successResponse(res, { success: true });
}
