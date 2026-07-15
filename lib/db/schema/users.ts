import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    age: integer("age"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    ageCheck: check("users_age_check", sql`${t.age} >= 0`),
  }),
);
