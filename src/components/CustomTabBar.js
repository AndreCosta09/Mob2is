import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Text style={{ 
              color: isFocused ? '#F18F01' : '#999', 
              fontWeight: isFocused ? 'bold' : 'normal',
              fontSize: 16
            }}>
              {options.tabBarLabel}
            </Text>
            {isFocused && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    height: 70, 
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  tabButton: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  indicator: {
    marginTop: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F18F01'
  }
});