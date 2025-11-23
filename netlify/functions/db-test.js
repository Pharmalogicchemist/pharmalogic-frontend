import { neon } from "@neondatabase/client";

export default async () => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // simple test query
    const result = await sql`SELECT NOW() AS server_time`;

    return Response.json({
      success: true,
      message: "Neon DB connected successfully!",
      time: result[0].server_time
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
};
