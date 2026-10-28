
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export const STATUSES = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;