import React, { useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import i18n from "./src/i18n";
import SplashScreen from "./src/screens/SplashScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LocationBlockedScreen from "./src/screens/LocationBlockedScreen";
import MapScreen from "./src/screens/MapScreen";
import SearchScreen from "./src/screens/SearchScreen";
import MoreScreen from "./src/screens/MoreScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import TermsScreen from "./src/screens/TermsScreen";
import RoutePlannerScreen from "./src/screens/RoutePlannerScreen";
import CustomTabBar from "./src/components/CustomTabBar";
import { UserContext, UserProvider } from "./src/context/UserContext";
import { resolveLocationPermission } from "./src/utils/locationPermission";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
const KEY_LANG = "mob2is_lang_v1";

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MoreHome">
      <MoreStack.Screen name="MoreHome" component={MoreScreen} />
      <MoreStack.Screen name="RoutePlanner" component={RoutePlannerScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
      <MoreStack.Screen name="Terms" component={TermsScreen} />
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
      <Tab.Screen
        name="Explorar"
        component={MapScreen}
        options={{ tabBarLabel: t("tabs.explore") }}
      />
      <Tab.Screen
        name="Pesquisar"
        component={SearchScreen}
        options={{ tabBarLabel: t("tabs.search") }}
      />
      <Tab.Screen
        name="Mais"
        component={MoreStackNavigator}
        options={{ tabBarLabel: t("tabs.more") }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { condition, loading: userLoading, saveCondition } = useContext(UserContext) ?? {};
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [locationStatus, setLocationStatus] = useState("checking");
  const [showLocationNotice, setShowLocationNotice] = useState(false);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => setShowSplash(false), 1500);

    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem(KEY_LANG);
        if (storedLang) {
          await i18n.changeLanguage(storedLang);
        }

        const nextLocationStatus = await resolveLocationPermission();
        if (alive) {
          setLocationStatus(nextLocationStatus);
          setShowLocationNotice(nextLocationStatus === "denied");
        }
      } catch (error) {
        console.error("App startup error:", error);
        if (alive) {
          setLocationStatus("denied");
          setShowLocationNotice(true);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (locationStatus !== "denied") return undefined;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;

      (async () => {
        try {
          const nextLocationStatus = await resolveLocationPermission({ prompt: false });
          setLocationStatus(nextLocationStatus);
          if (nextLocationStatus === "granted") {
            setShowLocationNotice(false);
          }
        } catch (error) {
          console.warn("Location permission refresh error:", error);
        }
      })();
    });

    return () => subscription.remove();
  }, [locationStatus]);

  const retryLocationPermission = async () => {
    setLocationStatus("checking");

    try {
      const nextLocationStatus = await resolveLocationPermission();
      setLocationStatus(nextLocationStatus);
      setShowLocationNotice(nextLocationStatus === "denied");
    } catch (error) {
      console.warn("Location permission request error:", error);
      setLocationStatus("denied");
      setShowLocationNotice(true);
    }
  };

  const openLocationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.warn("Open settings error:", error);
    }
  };

  const shouldShowSplash =
    loading || userLoading || showSplash || locationStatus === "checking";

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        {shouldShowSplash ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : locationStatus !== "granted" && showLocationNotice ? (
          <Stack.Screen name="LocationBlocked">
            {(props) => (
              <LocationBlockedScreen
                {...props}
                onRetry={retryLocationPermission}
                onOpenSettings={openLocationSettings}
                onContinue={() => setShowLocationNotice(false)}
              />
            )}
          </Stack.Screen>
        ) : condition ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Onboarding">
            {(props) => <OnboardingScreen {...props} onDone={saveCondition} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </UserProvider>
  );
}
