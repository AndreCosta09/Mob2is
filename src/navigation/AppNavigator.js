import React, { useContext } from "react";
import { View, Text } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { UserContext, UserProvider } from "../context/UserContext";
import OnboardingScreen from "../screens/OnboardingScreen";
import MapScreen from "../screens/MapScreen";
import SearchScreen from "../screens/SearchScreen";
import MoreScreen from "../screens/MoreScreen";
import SettingsScreen from "../screens/SettingsScreen";
import CustomTabBar from "../components/CustomTabBar";
import "../i18n";

const NavTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent" },
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();


function Placeholder({ title }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{title}</Text>
    </View>
  );
}


function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MoreHome">
      <MoreStack.Screen name="MoreHome" component={MoreScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
    </MoreStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
        sceneContainerStyle: { backgroundColor: "transparent" },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Explorar" component={MapScreen} options={{ tabBarLabel: "Explorar" }} />
      <Tab.Screen name="Pesquisar" component={SearchScreen} options={{ tabBarLabel: "Pesquisar" }} />
      <Tab.Screen name="Mais" component={MoreStackNavigator} options={{ tabBarLabel: "Mais" }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { condition, loading, saveCondition } = useContext(UserContext);

  if (loading) return <Placeholder title="A carregar..." />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      {condition ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Onboarding">
          {(props) => <OnboardingScreen {...props} onDone={saveCondition} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <UserProvider>
      <NavigationContainer theme={NavTheme}>
        <RootNavigator />
      </NavigationContainer>
    </UserProvider>
  );
}
