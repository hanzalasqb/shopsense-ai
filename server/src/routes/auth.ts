import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "../db/client";
import { users } from "../db/schema";
import { hashPassword, requireAuth, signToken, verifyPassword } from "../lib/auth";
import { HttpError } from "../lib/errors";

const Register = z.object({ email: z.string().email(), name: z.string().min(2).max(120), password: z.string().min(8).max(100) });
const Login = z.object({ email: z.string().email(), password: z.string().max(100) });

export function authRoutes(db: DB) {
  const r = Router();
  r.post("/register", async (req, res) => {
    const body = Register.parse(req.body);
    const email = body.email.toLowerCase();
    if ((await db.select({ id: users.id }).from(users).where(eq(users.email, email))).length) throw new HttpError(409, "Email already registered");
    const [u] = await db.insert(users).values({ email, name: body.name, passwordHash: await hashPassword(body.password) }).returning();
    const user = { id: u.id, email: u.email, name: u.name, role: "customer" as const };
    res.status(201).json({ token: await signToken(user), user });
  });
  r.post("/login", async (req, res) => {
    const body = Login.parse(req.body);
    const [u] = await db.select().from(users).where(eq(users.email, body.email.toLowerCase()));
    if (!u || !(await verifyPassword(body.password, u.passwordHash))) throw new HttpError(401, "Invalid email or password");
    const user = { id: u.id, email: u.email, name: u.name, role: u.role === "admin" ? ("admin" as const) : ("customer" as const) };
    res.json({ token: await signToken(user), user });
  });
  r.get("/me", requireAuth, (req, res) => { res.json(req.user); });
  return r;
}
