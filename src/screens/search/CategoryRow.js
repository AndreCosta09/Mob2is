import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import AnimatedPressable from "./AnimatedPressable";
import { C } from "./constants";

export default function CategoryRow({ item, active, onPress }) {
  const a = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(a, {
      toValue: active ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [active, a]);

  const bg = a.interpolate({ inputRange: [0, 1], outputRange: [C.pill, C.green] });
  const txt = a.interpolate({ inputRange: [0, 1], outputRange: [C.text, C.white] });

  return (
    <AnimatedPressable onPress={onPress} containerStyle={S.wrap} style={[S.btn, { backgroundColor: bg }]}>
      <Animated.Text style={[S.txt, { color: txt }]}>{item.name}</Animated.Text>
    </AnimatedPressable>
  );
}

const S = StyleSheet.create({
  wrap: { width: "100%", alignSelf: "stretch", marginBottom: 12 },
  btn: {
    width: "100%",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(102,112,128,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  txt: { fontWeight: "900", letterSpacing: 0.2, textAlign: "center", fontSize: 14 },
});
