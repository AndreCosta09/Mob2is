import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useTranslation } from "react-i18next";
import i18n from "./src/i18n";




import SplashScreen from "./src/screens/SplashScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import MapScreen from "./src/screens/MapScreen";
import SearchScreen from "./src/screens/SearchScreen";
import MoreScreen from "./src/screens/MoreScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

import CustomTabBar from "./src/components/CustomTabBar";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();


const KEY = "userCondition";
const KEY_LANG = "mob2is_lang_v1";

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MoreHome">
      <MoreStack.Screen name="MoreHome" component={MoreScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
    </MoreStack.Navigator>
  );
}

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator 
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Explorar" component={MapScreen} options={{ tabBarLabel: t("tabs.explore") }} />
      <Tab.Screen name="Pesquisar" component={SearchScreen} options={{ tabBarLabel: t("tabs.search") }} />
      <Tab.Screen name="Mais" component={MoreStackNavigator} options={{ tabBarLabel: t("tabs.more") }} />

    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [condition, setCondition] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);

    (async () => {
      try {
       const [[, storedCondition], [, storedLang]] =
          await AsyncStorage.multiGet([KEY, KEY_LANG]);
       if (storedLang) await i18n.changeLanguage(storedLang);
       if (storedCondition) setCondition(storedCondition);

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

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator   screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" }, 
      }}>
          {(loading || showSplash) ? (
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : condition ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Onboarding">
              {(props) => <OnboardingScreen {...props} onDone={saveCondition} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
