import { useContext, useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { UserContext } from "../../context/UserContext";
import { getMotionDuration } from "../../utils/accessibility";

export default function useScreenTransition(key) {
  const anim = useRef(new Animated.Value(1)).current;
  const { preferences } = useContext(UserContext) ?? {};
  const reduceMotion = !!preferences?.reduceMotion;

  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(1);
      return;
    }

    anim.setValue(0);
    const transition = Animated.timing(anim, {
      toValue: 1,
      duration: getMotionDuration(reduceMotion, 320),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    transition.start();
    return () => transition.stop();
  }, [key, anim, reduceMotion]);

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
