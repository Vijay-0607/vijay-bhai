import { prisma } from '../../lib/prisma';

export type NotificationType =
  | 'new_match'
  | 'new_offer'
  | 'counteroffer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'deal_confirmed'
  | 'deal_completed'
  | 'price_alert';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedEntityType: params.relatedEntityType ?? null,
      relatedEntityId: params.relatedEntityId ?? null,
      link: params.link ?? null,
    },
  });
}

export async function createNotificationsBulk(params: CreateNotificationParams[]): Promise<void> {
  if (params.length === 0) return;
  await prisma.notification.createMany({
    data: params.map((p) => ({
      userId: p.userId,
      type: p.type,
      title: p.title,
      message: p.message,
      relatedEntityType: p.relatedEntityType ?? null,
      relatedEntityId: p.relatedEntityId ?? null,
      link: p.link ?? null,
    })),
  });
}
