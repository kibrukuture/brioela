# Draft: node-renderers.ts (gap — file does not exist)

Target: `mobile/grammar/node-renderers.ts`

**Gap (feature 52):** Primitive type → compiled component map.

**Source:** `05-renderer-and-fallback.md`

---

```typescript
import type { ComponentType } from 'react'
import type { UiLayoutNode } from '@brioela/shared/grammar/schema/primitives'
import { StackNode } from './nodes/structural/stack-node'
import { HeadlineNode } from './nodes/expressive/headline-node'
import { CaptionNode } from './nodes/expressive/caption-node'
import { MetricSingleNode } from './nodes/expressive/metric-single-node'
import { MesaMemberRowNode } from './nodes/domain/mesa-member-row-node'

export type NodeRendererProps<T extends UiLayoutNode> = {
	node: T
}

export const NODE_RENDERERS = {
	stack: StackNode,
	headline: HeadlineNode,
	caption: CaptionNode,
	metric_single: MetricSingleNode,
	mesa_member_row: MesaMemberRowNode,
} as const satisfies {
	[K in UiLayoutNode['type']]: ComponentType<NodeRendererProps<Extract<UiLayoutNode, { type: K }>>>
}

export function renderUiLayoutNode(node: UiLayoutNode): React.ReactElement {
	const Component = NODE_RENDERERS[node.type]
	return <Component node={node} />
}
```
