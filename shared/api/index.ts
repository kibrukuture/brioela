import {
  USER_ROUTES,
  USER_ROUTE_PATTERNS,
} from "@brioela/shared/api/users.routes";
import { MEDICATION_ROUTES } from "@brioela/shared/api/medications.routes";
import { LAB_RESULT_ROUTES } from "@brioela/shared/api/lab-results.routes";
import {
  DOCUMENT_ROUTE_PATTERNS,
  DOCUMENT_ROUTES,
} from "@brioela/shared/api/documents.routes";
import {
  WEBHOOK_ROUTES,
  WEBHOOK_ROUTE_PATTERNS,
} from "@brioela/shared/api/webhooks.routes";
import {
  QUEUE_ROUTES,
  QUEUE_ROUTE_PATTERNS,
} from "@brioela/shared/api/queue.routes";
import {
  PAYMENTS_ROUTES,
  PAYMENTS_ROUTE_PATTERNS,
} from "@brioela/shared/api/payments.routes";
import {
  DEVICE_ROUTES,
  DEVICE_ROUTE_PATTERNS,
} from "@brioela/shared/api/devices.routes";
import {
  STRESS_TEST_ROUTES,
  STRESS_TEST_ROUTE_PATTERNS,
} from "@brioela/shared/api/stress-test.routes";
import {
  CARD_CONTROLS_ROUTES,
  CARD_CONTROLS_ROUTE_PATTERNS,
} from "@brioela/shared/api/card-controls.routes";
import {
  CARDS_ROUTES,
  CARDS_ROUTE_PATTERNS,
} from "@brioela/shared/api/cards.routes";
import {
  NOTIFICATIONS_ROUTES,
  NOTIFICATIONS_ROUTE_PATTERNS,
} from "@brioela/shared/api/notifications.routes";
import {
  IN_APP_NOTIFICATIONS_ROUTES,
  IN_APP_NOTIFICATIONS_ROUTE_PATTERNS,
} from "@brioela/shared/api/in-app-notifications.routes";
import { AUTH_ROUTES } from "@brioela/shared/api/auth.routes";
import {
  AVAILABILITY_ROUTES,
  AVAILABILITY_ROUTE_PATTERNS,
} from "@brioela/shared/api/availability.routes";
import {
  BANKING_ROUTES,
  BANKING_ROUTE_PATTERNS,
} from "@brioela/shared/api/banking.routes";
import {
  COMMUNICATION_CODE_ROUTES,
  COMMUNICATION_CODE_ROUTE_PATTERNS,
} from "@brioela/shared/api/communication-codes.routes";
import {
  MAPS_ROUTES,
  MAPS_ROUTE_PATTERNS,
} from "@brioela/shared/api/maps.routes";

export * from "@brioela/shared/api/no-middleware-check.routes";
export * from "@brioela/shared/api/health-check.routes";
export * from "@brioela/shared/api/allowed-cors-origins";
export * from "@brioela/shared/api/documents.routes";
export * from "@brioela/shared/api/payments.routes";
export * from "@brioela/shared/api/stress-test.routes";
export * from "@brioela/shared/api/devices.routes";
export * from "@brioela/shared/api/auth.routes";
export * from "@brioela/shared/api/card-controls.routes";
export * from "@brioela/shared/api/cards.routes";
export * from "@brioela/shared/api/notifications.routes";
export * from "@brioela/shared/api/in-app-notifications.routes";
export * from "@brioela/shared/api/maps.routes";

export const API_ROUTES = {
  users: USER_ROUTES,
  medications: MEDICATION_ROUTES,
  labResults: LAB_RESULT_ROUTES,
  webhooks: WEBHOOK_ROUTES,
  queue: QUEUE_ROUTES,
  documents: DOCUMENT_ROUTES,
  payments: PAYMENTS_ROUTES,
  stressTest: STRESS_TEST_ROUTES,
  auth: AUTH_ROUTES,
  devices: DEVICE_ROUTES,
  cardControls: CARD_CONTROLS_ROUTES,
  cards: CARDS_ROUTES,
  notifications: NOTIFICATIONS_ROUTES,
  inAppNotifications: IN_APP_NOTIFICATIONS_ROUTES,
  availability: AVAILABILITY_ROUTES,
  banking: BANKING_ROUTES,
  communicationCode: COMMUNICATION_CODE_ROUTES,
  maps: MAPS_ROUTES,
} as const;

export const API_ROUTE_PATTERNS = {
  users: USER_ROUTE_PATTERNS,
  webhooks: WEBHOOK_ROUTE_PATTERNS,
  queue: QUEUE_ROUTE_PATTERNS,
  documents: DOCUMENT_ROUTE_PATTERNS,
  payments: PAYMENTS_ROUTE_PATTERNS,
  stressTest: STRESS_TEST_ROUTE_PATTERNS,
  devices: DEVICE_ROUTE_PATTERNS,
  cardControls: CARD_CONTROLS_ROUTE_PATTERNS,
  cards: CARDS_ROUTE_PATTERNS,
  notifications: NOTIFICATIONS_ROUTE_PATTERNS,
  inAppNotifications: IN_APP_NOTIFICATIONS_ROUTE_PATTERNS,
  availability: AVAILABILITY_ROUTE_PATTERNS,
  banking: BANKING_ROUTE_PATTERNS,
  communicationCode: COMMUNICATION_CODE_ROUTE_PATTERNS,
  maps: MAPS_ROUTE_PATTERNS,
} as const;
