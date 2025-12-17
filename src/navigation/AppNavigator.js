import React, { useContext } from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { UserContext, UserProvider } from "../context/UserContext";
import OnboardingScreen from "../screens/OnboardingScreen";
import MapScreen from "../screens/MapScreen";
import SearchScreen from "../screens/SearchScreen";
import MoreScreen from "../screens/MoreScreen";
import CustomTabBar from "../components/CustomTabBar";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Placeholder({ title }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{title}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Explorar" component={MapScreen} options={{ tabBarLabel: "Explorar" }} />
      <Tab.Screen name="Pesquisar" component={SearchScreen} options={{ tabBarLabel: "Pesquisar" }} />
      <Tab.Screen name="Mais" component={MoreScreen} options={{ tabBarLabel: "Mais" }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { condition, loading, saveCondition } = useContext(UserContext);

  if (loading) return <Placeholder title="A carregar..." />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </UserProvider>
  );
}
