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
  
  // Email verification
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  
  // Stripe integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  
  // Subscription management
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  subscriptionStatus: text("subscription_status").default("active").notNull(),
  
  // Usage tracking
  monthlyUsage: integer("monthly_usage").default(0).notNull(),
  usageResetDate: timestamp("usage_reset_date").defaultNow().notNull(),
  
  // Refill pack credits (don't expire monthly)
  refillPackCredits: integer("refill_pack_credits").default(0).notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").default("Untitled Document"),
  inputContent: text("input_content").notNull(),
  latexContent: text("latex_content").notNull(),
  documentType: text("document_type").default("basic").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  compilationSuccessful: boolean("compilation_successful"),
  compilationError: text("compilation_error"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

export const anonymousUsers = pgTable("anonymous_users", {
  id: serial("id").primaryKey(),
  fingerprint: text("fingerprint").notNull().unique(),
  sessionId: text("session_id"),
  ipAddress: text("ip_address"),
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  documentType: z.string().default("basic"),
  options: z.object({
    splitTables: z.boolean().default(false),
    useMath: z.boolean().default(true),
    model: z.string().optional(),
  }).optional(),
});

// Create schema for anonymous users
export const insertAnonymousUserSchema = createInsertSchema(anonymousUsers, {
  fingerprint: (schema) => schema.min(5, "Fingerprint must be at least 5 characters"),
}).omit({ id: true, createdAt: true, usageCount: true, lastUsed: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertAnonymousUser = z.infer<typeof insertAnonymousUserSchema>;
export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type AnonymousUser = typeof anonymousUsers.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type GenerateLatexRequest = z.infer<typeof generateLatexSchema>;

// Subscription tiers
export enum SubscriptionTier {
  Free = "free",
  Basic = "tier1", // Alias for Tier1
  Pro = "tier3",   // Alias for Tier3
  Power = "tier5", // Alias for Tier5
  Tier1 = "tier1",
  Tier2 = "tier2",
  Tier3 = "tier3",
  Tier4 = "tier4",
  Tier5 = "tier5"
}

/**
 * Monthly subscription credit limits for each tier
 * All tiers are monthly subscriptions that renew and reset credits each month
 */
export const tierLimits = {
  [SubscriptionTier.Free]: 3,       // 3 generations per month (free users)
  [SubscriptionTier.Tier1]: 100,    // 100 requests per month ($0.99/month)
  [SubscriptionTier.Tier2]: 500,    // 500 requests per month ($2.99/month)
  [SubscriptionTier.Tier3]: 1200,   // 1,200 requests per month ($6.99/month)
  [SubscriptionTier.Tier4]: 2500,   // 2,500 requests per month ($11.99/month)
  [SubscriptionTier.Tier5]: 5000    // 5,000 requests per month ($19.99/month)
};

/**
 * Monthly subscription prices
 * All tiers are recurring monthly subscriptions
 */
export const tierPrices = {
  [SubscriptionTier.Free]: 0,       // Free tier
  [SubscriptionTier.Tier1]: 0.99,   // $0.99/month for 100 requests/month
  [SubscriptionTier.Tier2]: 2.99,   // $2.99/month for 500 requests/month
  [SubscriptionTier.Tier3]: 6.99,   // $6.99/month for 1,200 requests/month
  [SubscriptionTier.Tier4]: 11.99,  // $11.99/month for 2,500 requests/month
  [SubscriptionTier.Tier5]: 19.99   // $19.99/month for 5,000 requests/month
};

/** 
 * On-Demand Refill Pack Pricing (One-Time Purchase)
 * - These are one-time purchases that add credits to your account
 * - Refill pack credits do not expire monthly
 * - Used after subscription monthly credits are exhausted
 */
export const REFILL_PACK_CREDITS = 100;  // Each refill pack adds 100 requests
export const REFILL_PACK_PRICE = 0.99;   // Each refill pack costs $0.99 (one-time purchase)
