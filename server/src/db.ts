import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "codemesh",
  password: process.env.PGPASSWORD || "password",
  port: Number(process.env.PGPORT) || 54321,
});
