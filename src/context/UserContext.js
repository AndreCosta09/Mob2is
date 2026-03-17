import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeRoutePreference } from "../utils/userProfileOptions";

export const UserContext = createContext(null);

const KEY_CONDITION = "userCondition";
const KEY_ROUTE_PREFERENCE = "mob2is_route_preference_v1";

export function UserProvider({ children }) {
  const [condition, setCondition] = useState(null);
  const [routePreference, setRoutePreference] = useState("equilibrada");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [[, storedCondition], [, storedRoutePreference]] = await AsyncStorage.multiGet([
          KEY_CONDITION,
          KEY_ROUTE_PREFERENCE,
        ]);

        if (storedCondition) {
          setCondition(storedCondition);
        }

        if (storedRoutePreference) {
          setRoutePreference(normalizeRoutePreference(storedRoutePreference));
        }
      } catch (error) {
        console.error("loadUserPreferences error:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveCondition = async (newCondition) => {
    try {
      await AsyncStorage.setItem(KEY_CONDITION, newCondition);
      setCondition(newCondition);
    } catch (error) {
      console.error("saveCondition error:", error);
    }
  };

  const saveRoutePreference = async (nextRoutePreference) => {
    const normalized = normalizeRoutePreference(nextRoutePreference);

    try {
      await AsyncStorage.setItem(KEY_ROUTE_PREFERENCE, normalized);
      setRoutePreference(normalized);
    } catch (error) {
      console.error("saveRoutePreference error:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        condition,
        routePreference,
        loading,
        saveCondition,
        saveRoutePreference,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
