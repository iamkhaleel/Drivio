import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Adding test ride:", body);

    const {
      origin_address = "Times Square, New York, NY",
      destination_address = "Central Park, New York, NY",
      origin_latitude = 40.758,
      origin_longitude = -73.9855,
      destination_latitude = 40.7829,
      destination_longitude = -73.9654,
      ride_time = 15,
      fare_price = 1800,
      payment_status = "paid",
      driver_id = 1,
      user_id = "test_user_123",
    } = body;

    const sql = neon(process.env.DATABASE_URL);

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
          ${origin_address},
          ${destination_address},
          ${origin_latitude},
          ${origin_longitude},
          ${destination_latitude},
          ${destination_longitude},
          ${ride_time},
          ${fare_price},
          ${payment_status},
          ${driver_id},
          ${user_id}
      )
      RETURNING *;
    `;

    console.log("Test ride added successfully:", response[0]);

    return Response.json(
      {
        success: true,
        message: "Test ride added successfully",
        data: response[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding test ride:", error);
    return Response.json(
      {
        error: "Failed to add test ride",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
