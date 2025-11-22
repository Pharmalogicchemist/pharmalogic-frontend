import { Client } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export default async (req) => {
  try {
    const { fullname, email, password } = await req.json();

    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    const hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO auth_users (fullname, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, fullname, email;
    `;

    const result = await client.query(sql, [fullname, email, hash]);

    return Response.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return Response.json(
      { error: "Auth registration failed", details: err.message },
      { status: 400 }
    );
  }
};
