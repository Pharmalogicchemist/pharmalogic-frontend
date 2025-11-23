import { neon } from "@neondatabase/client";

const sql = neon(process.env.DATABASE_URL);

export default sql;
