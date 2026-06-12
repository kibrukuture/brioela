# Draft: bela.order.agent.ts (gap — file does not exist)

Target: `backend/src/agents/bela/bela.order.agent.ts`

**Gap:** No BelaOrderAgent DO. No `ORDER_AGENT` wrangler binding.

**Source:** `implementable-specs/bela/00-overview.md`, `13-data-model.md`, `build-guide/11-bela/04-live-scan-session.md`

**Architecture:** Ephemeral order DO — NOT Brain child sub-agent. Mira `bela_shopper` started via RPC to MiraSession (**29**), not embedded Gemini (G1).

---

```typescript
import { Agent, route } from 'agents'
import type { Connection, WSMessage } from 'agents'
import { z } from 'zod'
import type { BelaOrderAgentState } from './_state/bela.order.agent.state'
import { handleScanSessionMessage } from './_handlers/scan.session.handler'
import { transitionOrderStatus } from './_handlers/order.state.machine.handler'
import { scheduleAutoCaptureAlarm } from './_handlers/auto.capture.alarm.handler'
import { startBelaShopperMiraSession, stopBelaShopperMiraSession } from './_handlers/shopper.session.orchestrator.handler'
import { loadConstraintSnapshot } from './_helpers/load.constraint.snapshot.helper'

const scanSessionAuthSchema = z.object({
	role: z.enum(['user', 'shopper']),
	token: z.string().min(1),
})

export class BelaOrderAgent extends Agent<Env, BelaOrderAgentState> {
	initialState: BelaOrderAgentState = {
		orderId: '',
		userId: '',
		shopperId: '',
		status: 'accepted',
		constraintSnapshot: { orderId: '', capturedAt: 0, hardBlocks: [], softGuidance: [] },
		userWs: null,
		shopperWs: null,
		miraSessionId: null,
		pendingSubstitution: null,
	}

	async onStart(orderId: string, userId: string, shopperId: string): Promise<void> {
		const snapshot = await loadConstraintSnapshot(this.env, orderId)
		this.setState({
			...this.state,
			orderId,
			userId,
			shopperId,
			constraintSnapshot: snapshot,
		})
	}

	@route('/scan-session')
	async scanSession(request: Request): Promise<Response> {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected WebSocket', { status: 426 })
		}
		const url = new URL(request.url)
		const auth = scanSessionAuthSchema.safeParse({
			role: url.searchParams.get('role'),
			token: url.searchParams.get('token'),
		})
		if (!auth.success) {
			return new Response('Unauthorized', { status: 401 })
		}
		const pair = new WebSocketPair()
		const [client, server] = Object.values(pair)
		this.acceptScanConnection(server, auth.data.role)
		return new Response(null, { status: 101, webSocket: client })
	}

	@route('/start-shopping', 'POST')
	async startShopping(): Promise<Response> {
		await transitionOrderStatus(this.env, this.state, 'shopping')
		const miraSessionId = await startBelaShopperMiraSession(this.env, {
			orderId: this.state.orderId,
			shopperId: this.state.shopperId,
			constraintSnapshot: this.state.constraintSnapshot,
		})
		this.setState({ ...this.state, status: 'shopping', miraSessionId })
		return Response.json({ ok: true, miraSessionId })
	}

	@route('/door-receipt-scanned', 'POST')
	async doorReceiptScanned(): Promise<Response> {
		await transitionOrderStatus(this.env, this.state, 'delivered')
		await scheduleAutoCaptureAlarm(this, this.state.orderId)
		return Response.json({ ok: true })
	}

	@route('/complete', 'POST')
	async complete(): Promise<Response> {
		if (this.state.miraSessionId) {
			await stopBelaShopperMiraSession(this.env, this.state.miraSessionId)
		}
		await transitionOrderStatus(this.env, this.state, 'completed')
		return Response.json({ ok: true })
	}

	private acceptScanConnection(ws: WebSocket, role: 'user' | 'shopper'): void {
		ws.accept()
		if (role === 'user') {
			this.setState({ ...this.state, userWs: ws })
		} else {
			this.setState({ ...this.state, shopperWs: ws })
		}
		ws.addEventListener('message', (event: MessageEvent<WSMessage>) => {
			void handleScanSessionMessage(this.env, this.state, ws, role, event.data)
		})
		ws.addEventListener('close', () => {
			if (role === 'user') {
				this.setState({ ...this.state, userWs: null })
			} else {
				this.setState({ ...this.state, shopperWs: null })
			}
		})
	}

	async alarm(): Promise<void> {
		await this.env.BELA_PAYMENT_SERVICE.captureAutoConfirm(this.state.orderId)
	}
}
```
