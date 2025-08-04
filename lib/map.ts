import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

// Helper function to validate coordinates
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    lat !== null &&
    lng !== null &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

// Helper function to make a safe directions API call
const makeDirectionsRequest = async (
  origin: string,
  destination: string
): Promise<number | null> => {
  try {
    if (!directionsAPI) {
      console.warn("Directions API key not configured");
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${directionsAPI}`
    );

    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      console.warn("No route found between points:", origin, "->", destination);
      return null;
    }

    if (data.status !== "OK") {
      console.warn("Directions API error:", data.status, data.error_message);
      return null;
    }

    if (!data.routes || data.routes.length === 0) {
      console.warn("No routes returned from Directions API");
      return null;
    }

    return data.routes[0].legs[0].duration.value; // Time in seconds
  } catch (error) {
    console.error("Error making directions request:", error);
    return null;
  }
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude ||
    !isValidCoordinate(userLatitude, userLongitude) ||
    !isValidCoordinate(destinationLatitude, destinationLongitude)
  ) {
    console.warn("Invalid coordinates provided for driver time calculation");
    return;
  }

  try {
    const timesPromises = markers.map(async (marker) => {
      // Validate marker coordinates
      if (!isValidCoordinate(marker.latitude, marker.longitude)) {
        console.warn(
          "Invalid marker coordinates:",
          marker.latitude,
          marker.longitude
        );
        return { ...marker, time: 0, price: "0.00" };
      }

      const originToUser = `${marker.latitude},${marker.longitude}`;
      const userToDestination = `${userLatitude},${userLongitude}`;
      const destinationCoords = `${destinationLatitude},${destinationLongitude}`;

      const timeToUser = await makeDirectionsRequest(
        originToUser,
        userToDestination
      );
      const timeToDestination = await makeDirectionsRequest(
        userToDestination,
        destinationCoords
      );

      // If either request fails, use default values
      if (timeToUser === null || timeToDestination === null) {
        console.warn("Using default time calculation for driver:", marker.id);
        const defaultTime = 15; // 15 minutes default
        const price = (defaultTime * 0.5).toFixed(2);
        return { ...marker, time: defaultTime, price };
      }

      const totalTime = (timeToUser + timeToDestination) / 60; // Total time in minutes
      const price = (totalTime * 0.5).toFixed(2); // Calculate price based on time

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
    return markers.map((marker) => ({ ...marker, time: 15, price: "7.50" }));
  }
};
