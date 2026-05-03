import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "codemesh",
  password: "password",
  port: 54321,
});