// netlify/functions/db-test.js
const { sql } = require("./database.js");

exports.handler = async () => {
  try {
    const rows = await sql`SELECT NOW() AS now`;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, now: rows[0].now })
    };
  } catch (err) {
    console.error("DB test error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "DB error" })
    };
  }
};
