import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserContext, UserProvider } from '../context/UserContext';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MapScreen from '../screens/MapScreen';
import CustomTabBar from '../components/CustomTabBar';

const SearchScreen = () => <MapScreen />;
const MoreScreen = () => <></>;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Explorar" component={MapScreen} options={{ tabBarLabel: 'Explorar' }} />
      <Tab.Screen name="Pesquisar" component={SearchScreen} options={{ tabBarLabel: 'Pesquisar' }} />
      <Tab.Screen name="Mais" component={MoreScreen} options={{ tabBarLabel: 'Mais' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { condition, loading } = useContext(UserContext);
  if (loading) return null;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {condition ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </>
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