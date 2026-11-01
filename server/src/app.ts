import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { DB } from "./db/client";
import { errorHandler } from "./lib/errors";
import type { LLM } from "./lib/llm";
import { adminRoutes } from "./routes/admin";
import { assistantRoutes } from "./routes/assistant";
import { authRoutes } from "./routes/auth";
import { catalogRoutes } from "./routes/catalog";
import { orderRoutes } from "./routes/orders";

export function createApp(db: DB, llm: LLM, opts: { corsOrigin: string } = { corsOrigin: "*" }) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: opts.corsOrigin }));
  app.use(express.json({ limit: "200kb" }));
  app.use("/api/", rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));
  app.use(["/api/assistant", "/api/search"], rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }));

  app.get("/api/health", (_req, res) => { res.json({ status: "ok", ai: llm.enabled ? "llm" : "rules" }); });
  app.use("/api/auth", authRoutes(db));
  app.use("/api", catalogRoutes(db, llm));
  app.use("/api/orders", orderRoutes(db));
  app.use("/api/assistant", assistantRoutes(db, llm));
  app.use("/api/admin", adminRoutes(db, llm));
  app.use(errorHandler);
  return app;
}
