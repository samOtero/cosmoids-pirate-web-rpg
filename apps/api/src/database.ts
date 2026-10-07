import pg from "pg";

for (const name of ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD"]) {
  if (!process.env[name]) {
    throw new Error(`Missing database environment variable: ${name}`);
  }
}

// pg reads the connection settings from the PG* environment variables.
export const pool = new pg.Pool({
  max: 5,
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000,
});
