import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [condition, setCondition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCondition = async () => {
      try {
        await AsyncStorage.clear();
        const storedCondition = await AsyncStorage.getItem('userCondition');
        if (storedCondition) setCondition(storedCondition);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadCondition();
  }, []);

  const saveCondition = async (newCondition) => {
    try {
      await AsyncStorage.setItem('userCondition', newCondition);
      setCondition(newCondition);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <UserContext.Provider value={{ condition, saveCondition, loading }}>
      {children}
    </UserContext.Provider>
  );
};