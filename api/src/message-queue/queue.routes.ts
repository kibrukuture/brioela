import { Hono } from 'hono';
import { verifyQStashSignature } from '@/message-queue/verify';
import { emailsJobOrchestrator } from '@/api/emails/jobs/emails.job';
import { API_ROUTE_PATTERNS } from '@schnl/shared/api';

import { alignPollingRouter } from '@/message-queue/align/polling.route';
import { expirePayRequestJob } from '@/api/banking/jobs/expire-pay-request.job';
import { executePayRequestPayoutJob } from '@/api/banking/jobs/execute-pay-request-payout.job';
import { executeOutgoingPayoutJob } from '@/api/banking/jobs/execute-outgoing-payout.job';
import { executePeerToPeerTransferJob } from '@/api/banking/jobs/execute-peer-to-peer-transfer.job';
import { runOfframpOutboxQueueJob } from '@/api/banking/jobs/run-offramp-outbox-queue.job';

const queueRoutes = new Hono();

// verify QStash signature
queueRoutes.use(verifyQStashSignature);

// Email job handler
queueRoutes.post(API_ROUTE_PATTERNS.queue.email, emailsJobOrchestrator);

// Banking job handler
queueRoutes.post(API_ROUTE_PATTERNS.queue['banking.pay-request-expire'], expirePayRequestJob);
queueRoutes.post(API_ROUTE_PATTERNS.queue['banking.pay-request-execute-payout'], executePayRequestPayoutJob);
queueRoutes.post(API_ROUTE_PATTERNS.queue['banking.outgoing-payout-execute'], executeOutgoingPayoutJob);
queueRoutes.post(API_ROUTE_PATTERNS.queue['banking.peer-to-peer-execute'], executePeerToPeerTransferJob);
queueRoutes.post(API_ROUTE_PATTERNS.queue['banking.offramp-outbox-process'], runOfframpOutboxQueueJob);

queueRoutes.route(API_ROUTE_PATTERNS.queue['align.polling.provider'], alignPollingRouter);

export default queueRoutes;
