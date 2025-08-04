const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

async function checkDrivers() {
  try {
    console.log("Checking drivers...");

    const sql = neon(process.env.DATABASE_URL);

    const drivers = await sql`SELECT id, first_name, last_name FROM drivers`;
    console.log("Available drivers:", drivers);
  } catch (error) {
    console.error("Error checking drivers:", error);
  }
}

checkDrivers();
