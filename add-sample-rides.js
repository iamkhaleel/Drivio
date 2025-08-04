const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

async function addSampleRides() {
  try {
    console.log("Adding sample rides...");

    const sql = neon(process.env.DATABASE_URL);

    const sampleRides = [
      {
        origin_address: "Times Square, New York, NY",
        destination_address: "Central Park, New York, NY",
        origin_latitude: 40.758,
        origin_longitude: -73.9855,
        destination_latitude: 40.7829,
        destination_longitude: -73.9654,
        ride_time: new Date(),
        fare_price: 1800,
        payment_status: "paid",
        driver_id: 4,
        user_id: "user_2abc123def456", // Replace with your actual user ID
      },
      {
        origin_address: "Brooklyn Bridge, NY",
        destination_address: "Manhattan Bridge, NY",
        origin_latitude: 40.7061,
        origin_longitude: -73.9969,
        destination_latitude: 40.7084,
        destination_longitude: -73.9903,
        ride_time: new Date(Date.now() - 86400000), // 1 day ago
        fare_price: 1500,
        payment_status: "paid",
        driver_id: 5,
        user_id: "user_2abc123def456",
      },
      {
        origin_address: "Empire State Building, NY",
        destination_address: "Statue of Liberty, NY",
        origin_latitude: 40.7484,
        origin_longitude: -73.9857,
        destination_latitude: 40.6892,
        destination_longitude: -74.0445,
        ride_time: new Date(Date.now() - 172800000), // 2 days ago
        fare_price: 3200,
        payment_status: "paid",
        driver_id: 6,
        user_id: "user_2abc123def456",
      },
      {
        origin_address: "Grand Central Terminal, NY",
        destination_address: "Rockefeller Center, NY",
        origin_latitude: 40.7527,
        origin_longitude: -73.9772,
        destination_latitude: 40.7587,
        destination_longitude: -73.9787,
        ride_time: new Date(Date.now() - 259200000), // 3 days ago
        fare_price: 1200,
        payment_status: "pending",
        driver_id: 4,
        user_id: "user_2abc123def456",
      },
      {
        origin_address: "Madison Square Garden, NY",
        destination_address: "Penn Station, NY",
        origin_latitude: 40.7505,
        origin_longitude: -73.9934,
        destination_latitude: 40.7505,
        destination_longitude: -73.9934,
        ride_time: new Date(Date.now() - 345600000), // 4 days ago
        fare_price: 800,
        payment_status: "failed",
        driver_id: 5,
        user_id: "user_2abc123def456",
      },
    ];

    for (const ride of sampleRides) {
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
            ${ride.origin_address},
            ${ride.destination_address},
            ${ride.origin_latitude},
            ${ride.origin_longitude},
            ${ride.destination_latitude},
            ${ride.destination_longitude},
            ${ride.ride_time},
            ${ride.fare_price},
            ${ride.payment_status},
            ${ride.driver_id},
            ${ride.user_id}
        )
        RETURNING ride_id;
      `;

      console.log(
        `Added ride ${response[0].ride_id}: ${ride.origin_address} → ${ride.destination_address}`
      );
    }

    // Check total rides
    const count = await sql`SELECT COUNT(*) as count FROM rides`;
    console.log("Total rides now:", count[0].count);
  } catch (error) {
    console.error("Error adding sample rides:", error);
  }
}

addSampleRides();
