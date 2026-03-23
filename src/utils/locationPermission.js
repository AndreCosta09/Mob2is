import { PermissionsAndroid, Platform } from "react-native";
import Geolocation from "react-native-geolocation-service";

import i18n from "../i18n";

export const DEV_STATIC_LOCATION_ENABLED = true;
export const DEV_STATIC_LOCATION_COORDS = [-8.841553, 41.692801];

export function shouldUseDevStaticLocation() {
  return __DEV__ && DEV_STATIC_LOCATION_ENABLED;
}

export async function resolveLocationPermission({ prompt = true } = {}) {
  if (shouldUseDevStaticLocation()) {
    return "granted";
  }

  if (Platform.OS === "ios") {
    const status = await Geolocation.requestAuthorization("whenInUse");
    return status === "granted" ? "granted" : "denied";
  }

  const fineLocation = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const hasPermission = await PermissionsAndroid.check(fineLocation);

  if (hasPermission) {
    return "granted";
  }

  if (!prompt) {
    return "denied";
  }

  const status = await PermissionsAndroid.request(fineLocation, {
    title: i18n.t("locationBlocked.badge"),
    message: i18n.t("routeFlow.permission_required_message"),
    buttonPositive: i18n.t("common.ok"),
    buttonNegative: i18n.t("common.cancel"),
  });

  return status === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied";
}

function getCurrentPositionAsync(options) {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function mapLocationErrorToStatus(error) {
  if (error?.code === 1) return "denied";
  if (error?.code === 5) return "disabled";
  return "unavailable";
}

export async function ensureLocationReady({ prompt = true } = {}) {
  if (shouldUseDevStaticLocation()) {
    return {
      ok: true,
      status: "granted",
      coords: DEV_STATIC_LOCATION_COORDS,
      position: null,
    };
  }

  const permissionStatus = await resolveLocationPermission({ prompt });
  if (permissionStatus !== "granted") {
    return { ok: false, status: permissionStatus, coords: null };
  }

  try {
    const position = await getCurrentPositionAsync({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 1500,
      showLocationDialog: prompt,
      forceRequestLocation: prompt,
    });

    return {
      ok: true,
      status: "granted",
      coords: [position.coords.longitude, position.coords.latitude],
      position,
    };
  } catch (error) {
    return {
      ok: false,
      status: mapLocationErrorToStatus(error),
      coords: null,
      error,
    };
  }
}
