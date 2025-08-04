import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

// Log API key status for debugging (remove in production)
if (!directionsAPI) {
  console.warn(
    "⚠️ EXPO_PUBLIC_DIRECTIONS_API_KEY is not configured. Directions will not work."
  );
}

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

// Helper function to check if coordinates are significantly different
const areCoordinatesDifferent = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): boolean => {
  const latDiff = Math.abs(lat1 - lat2);
  const lngDiff = Math.abs(lng1 - lng2);
  // Check if coordinates are at least 0.0001 degrees apart (roughly 11 meters)
  return latDiff > 0.0001 || lngDiff > 0.0001;
};

const Map = () => {
  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();
  const { selectedDriver, setDrivers } = useDriverStore();

  const { data: drivers, loading, error } = useFetch<Driver[]>("/(api)/driver");
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) return;

      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });

      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude !== undefined &&
      destinationLongitude !== undefined
    ) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        setDrivers(drivers as MarkerData[]);
      });
    }
  }, [markers, destinationLatitude, destinationLongitude]);

  const region = calculateRegion({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  });

  // Check if we should render directions
  const shouldRenderDirections =
    destinationLatitude !== null &&
    destinationLongitude !== null &&
    userLatitude !== null &&
    userLongitude !== null &&
    isValidCoordinate(userLatitude, userLongitude) &&
    isValidCoordinate(destinationLatitude, destinationLongitude) &&
    areCoordinatesDifferent(
      userLatitude,
      userLongitude,
      destinationLatitude,
      destinationLongitude
    ) &&
    directionsAPI;

  if (loading || (!userLatitude && !userLongitude))
    return (
      <View className="flex justify-between items-center w-full">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );

  if (error)
    return (
      <View className="flex justify-between items-center w-full">
        <Text>Error: {error}</Text>
      </View>
    );

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      className="w-full h-full rounded-2xl"
      tintColor="black"
      mapType="mutedStandard"
      showsPointsOfInterest={false}
      initialRegion={region}
      showsUserLocation={true}
      userInterfaceStyle="light"
    >
      {markers.map((marker, index) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          image={
            selectedDriver === +marker.id ? icons.selectedMarker : icons.marker
          }
        />
      ))}

      {destinationLatitude && destinationLongitude && (
        <Marker
          key="destination"
          coordinate={{
            latitude: destinationLatitude,
            longitude: destinationLongitude,
          }}
          title="Destination"
          image={icons.pin}
        />
      )}

      {shouldRenderDirections && (
        <MapViewDirections
          origin={{
            latitude: userLatitude!,
            longitude: userLongitude!,
          }}
          destination={{
            latitude: destinationLatitude!,
            longitude: destinationLongitude!,
          }}
          apikey={directionsAPI!}
          strokeColor="#0286FF"
          strokeWidth={2}
          onError={(errorMessage) => {
            console.warn("MapViewDirections error:", errorMessage);
            setDirectionsError(errorMessage);
          }}
          onReady={() => {
            setDirectionsError(null);
          }}
          optimizeWaypoints={true}
          mode="DRIVING"
        />
      )}
    </MapView>
  );
};

export default Map;
