import { API_ROUTES } from '@brioela/shared/api';
import type {
  ListInAppNotificationsResponse,
  UpdateInAppNotificationInput,
  UpdateInAppNotificationResponse,
  MarkAllInAppNotificationsReadResponse,
} from '@brioela/shared/validators/in-app-notification.validator';
import * as api from '@/services/api';

export async function listInAppNotifications() {
  return api.get<ListInAppNotificationsResponse>(API_ROUTES.inAppNotifications.list());
}

export async function updateInAppNotification(id: string, input: UpdateInAppNotificationInput) {
  return api.patch<UpdateInAppNotificationResponse>(
    API_ROUTES.inAppNotifications.update(id),
    input
  );
}

export async function markAllInAppNotificationsRead() {
  return api.post<MarkAllInAppNotificationsReadResponse>(
    API_ROUTES.inAppNotifications.markAllRead()
  );
}
