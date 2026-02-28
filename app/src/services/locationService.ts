import * as Location from 'expo-location';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch (err) {
    console.error('[LocationService]', err);
    return null;
  }
}

/**
 * Haversine distance in km between two coordinates.
 */
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Filter an array of items that have lat/lng within the radius.
 */
export function filterByRadius<T extends { location: { lat: number; lng: number } }>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): T[] {
  return items.filter(
    (item) => distanceKm(centerLat, centerLng, item.location.lat, item.location.lng) <= radiusKm
  );
}
