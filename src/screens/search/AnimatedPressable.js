import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";

export default function AnimatedPressable({
  onPress,
  style,
  containerStyle,
  children,
  disabled,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.985, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable
      android_ripple={{ color: "rgba(5,31,65,0.06)" }}
      hitSlop={8}
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={containerStyle}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
