import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const UserContext = createContext(null);

const KEY = "userCondition";

export function UserProvider({ children }) {
  const [condition, setCondition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (stored) setCondition(stored);
      } catch (e) {
        console.error("loadCondition error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveCondition = async (newCondition) => {
    try {
      await AsyncStorage.setItem(KEY, newCondition);
      setCondition(newCondition);
    } catch (e) {
      console.error("saveCondition error:", e);
    }
  };

  return (
    <UserContext.Provider value={{ condition, loading, saveCondition }}>
      {children}
    </UserContext.Provider>
  );
}
