const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

async function testRideInsert() {
  try {
    console.log("Testing ride insertion...");

    const sql = neon(process.env.DATABASE_URL);

    // Test data - convert ride_time to timestamp
    const rideData = {
      origin_address: "Times Square, New York, NY",
      destination_address: "Central Park, New York, NY",
      origin_latitude: 40.758,
      origin_longitude: -73.9855,
      destination_latitude: 40.7829,
      destination_longitude: -73.9654,
      ride_time: new Date(), // Use current timestamp for now
      fare_price: 1800,
      payment_status: "paid",
      driver_id: 4, // Use valid driver ID
      user_id: "test_user_123",
    };

    console.log("Inserting ride data:", rideData);

    const response = await sql`
      INSERT INTO rides ( 
          origin_address, 
          destination_address, 
          origin_latitude, 
          origin_longitude, 
          destination_latitude, 
          destination_longitude, 
          ride_time, 
          fare_price, 
          payment_status, 
          driver_id, 
          user_id
      ) VALUES (
          ${rideData.origin_address},
          ${rideData.destination_address},
          ${rideData.origin_latitude},
          ${rideData.origin_longitude},
          ${rideData.destination_latitude},
          ${rideData.destination_longitude},
          ${rideData.ride_time},
          ${rideData.fare_price},
          ${rideData.payment_status},
          ${rideData.driver_id},
          ${rideData.user_id}
      )
      RETURNING *;
    `;

    console.log("Ride inserted successfully:", response[0]);

    // Check total rides now
    const count = await sql`SELECT COUNT(*) as count FROM rides`;
    console.log("Total rides after insertion:", count[0].count);
  } catch (error) {
    console.error("Error inserting ride:", error);
  }
}

testRideInsert();
