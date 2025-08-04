const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

async function testDatabase() {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

    const sql = neon(process.env.DATABASE_URL);

    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log("Database connection successful:", result);

    // Check if rides table exists
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'rides'
    `;
    console.log("Rides table exists:", tableCheck.length > 0);

    if (tableCheck.length > 0) {
      // Get table structure
      const structure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'rides'
        ORDER BY ordinal_position
      `;
      console.log("Rides table structure:", structure);

      // Get count of rides
      const count = await sql`SELECT COUNT(*) as count FROM rides`;
      console.log("Total rides:", count[0].count);

      // Get sample rides
      const sample = await sql`
        SELECT ride_id, origin_address, destination_address, payment_status, created_at
        FROM rides
        ORDER BY created_at DESC
        LIMIT 3
      `;
      console.log("Sample rides:", sample);
    }

    // Check drivers table
    const driversCheck = await sql`
      SELECT COUNT(*) as count FROM drivers
    `;
    console.log("Total drivers:", driversCheck[0].count);
  } catch (error) {
    console.error("Database test failed:", error);
  }
}

testDatabase();
