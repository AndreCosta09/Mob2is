import { NativeModules } from "react-native";

const nativeConfig = NativeModules?.AppConfig ?? {};

export const MAPTILER_API_KEY =
  typeof nativeConfig.mapTilerApiKey === "string" ? nativeConfig.mapTilerApiKey.trim() : "";

export const MAP_STYLE_URL = MAPTILER_API_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`
  : null;
