import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  subscriptionStatus: text("subscription_status").default("active").notNull(),
  monthlyUsage: integer("monthly_usage").default(0).notNull(),
  usageResetDate: timestamp("usage_reset_date").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").default("Untitled Document"),
  inputContent: text("input_content").notNull(),
  latexContent: text("latex_content").notNull(),
  documentType: text("document_type").default("article").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  compilationSuccessful: boolean("compilation_successful"),
  compilationError: text("compilation_error"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents)
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] })
}));

// Validation schemas
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters"),
}).omit({ id: true, createdAt: true, updatedAt: true, monthlyUsage: true, usageResetDate: true });

export const insertDocumentSchema = createInsertSchema(documents, {
  title: (schema) => schema.min(1, "Title is required"),
  inputContent: (schema) => schema.min(1, "Input content is required"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const generateLatexSchema = z.object({
  content: z.string().min(1, "Content is required"),
  documentType: z.string().default("article"),
  options: z.object({
    splitTables: z.boolean().default(false),
    useMath: z.boolean().default(true),
    model: z.string().optional(),
  }).optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type GenerateLatexRequest = z.infer<typeof generateLatexSchema>;

// Subscription tiers
export enum SubscriptionTier {
  Free = "free",
  Basic = "basic",
  Pro = "pro",
  Power = "power"
}

export const tierLimits = {
  [SubscriptionTier.Free]: 3,
  [SubscriptionTier.Basic]: 50,
  [SubscriptionTier.Pro]: 250,
  [SubscriptionTier.Power]: 1000
};

export const tierPrices = {
  [SubscriptionTier.Free]: 0,
  [SubscriptionTier.Basic]: 4.99,
  [SubscriptionTier.Pro]: 9.99,
  [SubscriptionTier.Power]: 19.99
};
