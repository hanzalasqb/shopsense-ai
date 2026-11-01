import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, numeric, pgTable, real, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: "number" });

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  tagline: text("tagline").notNull().default(""),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  price: money("price").notNull(),
  compareAt: money("compare_at"),
  stock: integer("stock").notNull().default(0),
  rating: real("rating").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  description: text("description").notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  image: text("image").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("products_category_idx").on(t.categoryId)]);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  author: varchar("author", { length: 80 }).notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("reviews_product_idx").on(t.productId)]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  address: text("address").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("paid"),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("card"),
  discountCode: varchar("discount_code", { length: 30 }),
  subtotal: money("subtotal").notNull(),
  discount: money("discount").notNull().default(0),
  shipping: money("shipping").notNull(),
  tax: money("tax").notNull(),
  total: money("total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("orders_created_idx").on(t.createdAt)]);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  name: varchar("name", { length: 200 }).notNull(),
  unitPrice: money("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
}, (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)]);

export const aiCache = pgTable("ai_cache", {
  key: varchar("key", { length: 200 }).primaryKey(),
  value: jsonb("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  reviews: many(reviews),
}));
export const orderRelations = relations(orders, ({ many }) => ({ items: many(orderItems) }));
export const orderItemRelations = relations(orderItems, ({ one }) => ({ order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }) }));
