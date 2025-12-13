import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const TAB_HEIGHT = 80;

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.svgContainer}>
        <Svg width={width} height={TAB_HEIGHT} viewBox={`0 0 ${width} ${TAB_HEIGHT}`}>
          <Path
            fill="white"
            d={`M0,0 H${width} V${TAB_HEIGHT} H0 Z`} 
          />
        </Svg>
      </View>
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TouchableOpacity key={index} onPress={onPress} style={[styles.tabButton, isFocused ? styles.focusedButton : null]} activeOpacity={0.8}>
              {isFocused && <View style={styles.activeCircle} />}
              <Text style={{ color: isFocused ? '#28A745' : '#999', fontWeight: isFocused ? 'bold' : 'normal', marginTop: isFocused ? 25 : 0 }}>
                {options.tabBarLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, width: width, height: TAB_HEIGHT, elevation: 10 },
  svgContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, shadowColor: "#000", shadowOffset: {width: 0, height: -3}, shadowOpacity: 0.1, shadowRadius: 3 },
  tabsContainer: { flexDirection: 'row', height: '100%' },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  focusedButton: { top: -20 }, 
  activeCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', position: 'absolute', top: -10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 5, borderWidth: 4, borderColor: '#F5F5F5' }
});