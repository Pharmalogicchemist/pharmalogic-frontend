import { Client } from "pg";

export async function getClient() {
  const connectionString = process.env.NETLIFY_DATABASE_URL;

  if (!connectionString) {
    throw new Error("NETLIFY_DATABASE_URL is not set in Netlify environment variables");
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  return client;
}
