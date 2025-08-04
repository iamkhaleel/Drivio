import { Stripe } from "stripe";
import { neon } from "@neondatabase/serverless";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      payment_method_id,
      payment_intent_id,
      customer_id,
      client_secret,
      ride_data,
    } = body;

    if (!payment_method_id || !payment_intent_id || !customer_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const paymentMethod = await stripe.paymentMethods.attach(
      payment_method_id,
      { customer: customer_id }
    );

    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: paymentMethod.id,
    });

    // If payment is successful and ride data is provided, save the ride
    if (result.status === "succeeded" && ride_data) {
      try {
        console.log("Payment successful, saving ride data:", ride_data);

        const sql = neon(process.env.DATABASE_URL!);

        const {
          origin_address,
          destination_address,
          origin_latitude,
          origin_longitude,
          destination_latitude,
          destination_longitude,
          ride_time,
          fare_price,
          driver_id,
          user_id,
        } = ride_data as {
          origin_address: string;
          destination_address: string;
          origin_latitude: number;
          origin_longitude: number;
          destination_latitude: number;
          destination_longitude: number;
          ride_time: string;
          fare_price: number;
          driver_id: number;
          user_id: string;
        };

        // Insert the ride with payment_status as 'paid'
        const rideResponse = await sql`
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
              ${new Date()}, // Convert ride_time to timestamp
              ${fare_price},
              'paid',
              ${driver_id},
              ${user_id}
          )
          RETURNING ride_id;
        `;

        console.log("Ride saved successfully:", rideResponse[0]);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment successful and ride saved",
            result: result,
            ride_id: rideResponse[0]?.ride_id,
          })
        );
      } catch (dbError) {
        console.error("Error saving ride to database:", dbError);
        // Return payment success but note the ride save failed
        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment successful but ride save failed",
            result: result,
            ride_save_error:
              dbError instanceof Error ? dbError.message : "Unknown error",
          })
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment successful",
        result: result,
      })
    );
  } catch (error) {
    console.error("Error paying:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
