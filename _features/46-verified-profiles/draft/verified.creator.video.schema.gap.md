# Draft: verified.creator.video.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/verified.creator.video.schema.ts`

Source: `build-guide/23-verified-profiles/07-creator-video-firewall.md`

---

```typescript
import { sql } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { verifiedProfiles } from './verified.person.profile.schema'

export const verifiedCreatorVideos = pgTable(
  'verified_creator_videos',
  {
    videoId: uuid('video_id').primaryKey().defaultRandom(),
    verifiedProfileId: uuid('verified_profile_id')
      .notNull()
      .references(() => verifiedProfiles.profileId, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id'),
    title: text('title').notNull(),
    sourceUrl: text('source_url'),
    durationSeconds: integer('duration_seconds').notNull(),
    stepMarkersJson: jsonb('step_markers_json').notNull().default([]),
    constraintTags: jsonb('constraint_tags').notNull().default([]),
    cuisineTags: jsonb('cuisine_tags').notNull().default([]),
    difficulty: text('difficulty').notNull().$type<'easy' | 'medium' | 'hard'>(),
    verificationStatus: text('verification_status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileIdx: index('verified_creator_videos_profile_idx').on(table.verifiedProfileId),
    statusCheck: sql`check (${table.verificationStatus} in ('pending','approved','rejected'))`,
  }),
)

export type VerifiedCreatorVideoRow = typeof verifiedCreatorVideos.$inferSelect
```
