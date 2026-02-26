import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export default function useScreenTransition(key) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [key, anim]);

  return {
    opacity: anim,
    transform: [
      {
        translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }),
      },
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }),
      },
    ],
  };
}
