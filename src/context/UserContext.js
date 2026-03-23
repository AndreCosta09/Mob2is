import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeRoutePreference } from "../utils/userProfileOptions";
import {
  APP_PREFERENCES_KEY,
  DEFAULT_APP_PREFERENCES,
} from "../utils/accessibility";

export const UserContext = createContext(null);

const KEY_CONDITION = "userCondition";
const KEY_ROUTE_PREFERENCE = "mob2is_route_preference_v1";

export function UserProvider({ children }) {
  const [condition, setCondition] = useState(null);
  const [routePreference, setRoutePreference] = useState("equilibrada");
  const [preferences, setPreferences] = useState(DEFAULT_APP_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [[, storedCondition], [, storedRoutePreference], [, storedPrefs]] = await AsyncStorage.multiGet([
          KEY_CONDITION,
          KEY_ROUTE_PREFERENCE,
          APP_PREFERENCES_KEY,
        ]);

        if (storedCondition) {
          setCondition(storedCondition);
        }

        if (storedRoutePreference) {
          setRoutePreference(normalizeRoutePreference(storedRoutePreference));
        }

        if (storedPrefs) {
          try {
            setPreferences({
              ...DEFAULT_APP_PREFERENCES,
              ...JSON.parse(storedPrefs),
            });
          } catch (prefsError) {
            console.error("loadAccessibilityPreferences parse error:", prefsError);
          }
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

  const savePreferences = async (nextPreferences) => {
    const merged = {
      ...DEFAULT_APP_PREFERENCES,
      ...(nextPreferences ?? {}),
    };

    try {
      await AsyncStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(merged));
      setPreferences(merged);
    } catch (error) {
      console.error("savePreferences error:", error);
    }
  };

  const updatePreference = async (key, value) => {
    const nextPreferences = {
      ...preferences,
      [key]: value,
    };

    await savePreferences(nextPreferences);
  };

  return (
    <UserContext.Provider
      value={{
        condition,
        routePreference,
        preferences,
        loading,
        saveCondition,
        saveRoutePreference,
        savePreferences,
        updatePreference,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
