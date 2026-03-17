/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-geolocation-service', () => ({
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

jest.mock('../src/utils/locationPermission', () => ({
  resolveLocationPermission: jest.fn(() => Promise.resolve('granted')),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}: any) => children,
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({children}: any) => children,
    Screen: ({children}: any) => children ?? null,
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({children}: any) => children,
    Screen: ({component: Component, children}: any) =>
      children ? children({}) : Component ? <Component /> : null,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({children}: any) => children,
}));

jest.mock('../src/screens/SplashScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'Splash');
});
jest.mock('../src/screens/OnboardingScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'Onboarding');
});
jest.mock('../src/screens/LocationBlockedScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'LocationBlocked');
});
jest.mock('../src/screens/MapScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'Map');
});
jest.mock('../src/screens/SearchScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'Search');
});
jest.mock('../src/screens/MoreScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'More');
});
jest.mock('../src/screens/SettingsScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'Settings');
});
jest.mock('../src/screens/TermsScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'Terms');
});
jest.mock('../src/screens/RoutePlannerScreen', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'RoutePlanner');
});
jest.mock('../src/components/CustomTabBar', () => {
  const mockReact = require('react');
  const {Text: MockText} = require('react-native');
  return () => mockReact.createElement(MockText, null, 'TabBar');
});

it('renders correctly', async () => {
  jest.useFakeTimers();

  let tree: renderer.ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(<App />);
    await Promise.resolve();
  });

  act(() => {
    jest.runOnlyPendingTimers();
  });

  tree!.unmount();
  jest.useRealTimers();
});
