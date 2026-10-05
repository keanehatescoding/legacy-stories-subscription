import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const recordingKindEnum = pgEnum("recording_kind", ["audio", "video", "written"]);
export const promptStatusEnum = pgEnum("prompt_status", ["pending", "answered", "skipped"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trialing", "active", "past_due", "cancelled"]);
export const bookStatusEnum = pgEnum("book_status", ["drafting", "ready_for_proof", "approved", "printed", "shipped"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** The buyer, usually an adult child or grandchild giving the gift. */
export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone"),
  shippingAddress: text("shipping_address").notNull().default(""),
  ...timestamps,
});

/** The elder being prompted — the "author" of the finished book. May be the subscriber themselves. */
export const storytellers = pgTable(
  "storytellers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    nickname: text("nickname"),
    phone: text("phone"),
    email: text("email"),
    deliveryChannel: text("delivery_channel").notNull().default("sms"),
    locale: text("locale").notNull().default("en-KE"),
    ...timestamps,
  },
  (t) => [index("storytellers_subscriber_idx").on(t.subscriberId)],
);

/** A story prompt sent on a schedule. Prompts come from a shared library plus per-storyteller edits. */
export const prompts = pgTable(
  "prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storytellerId: uuid("storyteller_id")
      .notNull()
      .references(() => storytellers.id, { onDelete: "cascade" }),
    templateId: text("template_id"),
    weekNumber: integer("week_number").notNull(),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    status: promptStatusEnum("status").notNull().default("pending"),
    ...timestamps,
  },
  (t) => [
    index("prompts_storyteller_week_idx").on(t.storytellerId, t.weekNumber),
    index("prompts_status_sent_idx").on(t.status, t.sentAt),
  ],
);

export const recordings = pgTable(
  "recordings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    kind: recordingKindEnum("kind").notNull(),
    // Object-storage URL. Audio dominates in Kenya because voice notes are the default on WhatsApp.
    mediaUrl: text("media_url").notNull(),
    durationSeconds: integer("duration_seconds"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("recordings_prompt_idx").on(t.promptId)],
);

/** Human- or model-produced transcript. Edits produce new rows; the newest is "active". */
export const transcripts = pgTable(
  "transcripts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recordingId: uuid("recording_id")
      .notNull()
      .references(() => recordings.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    body: text("body").notNull(),
    editedBy: uuid("edited_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("transcripts_recording_version_idx").on(t.recordingId, t.version)],
);

export const books = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storytellerId: uuid("storyteller_id")
      .notNull()
      .references(() => storytellers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: bookStatusEnum("status").notNull().default("drafting"),
    pageCount: integer("page_count"),
    proofPdfUrl: text("proof_pdf_url"),
    printOrderRef: text("print_order_ref"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("books_storyteller_idx").on(t.storytellerId)],
);

/** One chapter in the book — ties to the recordings/transcripts it was built from. */
export const bookChapters = pgTable(
  "book_chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    heading: text("heading").notNull(),
    bodyMd: text("body_md").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    sourceRecordingIds: uuid("source_recording_ids").array().notNull().default(sql`'{}'::uuid[]`),
  },
  (t) => [index("book_chapters_book_idx").on(t.bookId, t.sortOrder)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    status: subscriptionStatusEnum("status").notNull().default("trialing"),
    monthlyPriceKes: integer("monthly_price_kes").notNull(),
    startedOn: timestamp("started_on", { withTimezone: true }).notNull().defaultNow(),
    endsOn: timestamp("ends_on", { withTimezone: true }),
    bookIncluded: boolean("book_included").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("subscriptions_subscriber_idx").on(t.subscriberId, t.status)],
);

export const storytellerRelations = relations(storytellers, ({ one, many }) => ({
  subscriber: one(subscribers, { fields: [storytellers.subscriberId], references: [subscribers.id] }),
  prompts: many(prompts),
  books: many(books),
}));

export type Subscriber = typeof subscribers.$inferSelect;
export type Storyteller = typeof storytellers.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type Book = typeof books.$inferSelect;
