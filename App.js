import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import SplashScreen from "./src/screens/SplashScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import MapScreen from "./src/screens/MapScreen";
import CustomTabBar from "./src/components/CustomTabBar";
import SearchScreen from "./src/screens/SearchScreen";

const Tab = createBottomTabNavigator();
const KEY = "userCondition";

function Placeholder({ title }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{title}</Text>
    </View>
  );
}
function MoreScreen() {
  return <Placeholder title="Mais (placeholder)" />;
}

export default function App() {
  console.log("APP BASELINE V2 LOADED");

  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [condition, setCondition] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (stored) setCondition(stored);
      } catch (e) {
        console.error("AsyncStorage load error:", e);
      } finally {
        setLoading(false);
      }
    })();

    return () => clearTimeout(timer);
  }, []);

  const saveCondition = async (value) => {
    try {
      await AsyncStorage.setItem(KEY, value);
      setCondition(value);
    } catch (e) {
      console.error("AsyncStorage save error:", e);
    }
  };

  if (loading || showSplash) return <SplashScreen />;

  if (!condition) return <OnboardingScreen onDone={saveCondition} />;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Explorar" component={MapScreen} options={{ tabBarLabel: "Explorar" }} />
        <Tab.Screen name="Pesquisar" component={SearchScreen} options={{ tabBarLabel: "Pesquisar" }} />
        <Tab.Screen name="Mais" component={MoreScreen} options={{ tabBarLabel: "Mais" }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
