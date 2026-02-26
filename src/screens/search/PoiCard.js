import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import AnimatedPressable from "./AnimatedPressable";
import { ASSETS, C } from "./constants";

export default function PoiCard({ item, index, onPress }) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 360,
      delay: index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const style = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  return (
    <Animated.View style={style}>
      <AnimatedPressable onPress={onPress} style={S.card}>
        <View style={S.imgWrap}>
          <Image source={{ uri: item.image ?? ASSETS.placeholder }} style={S.img} resizeMode="cover" />
        </View>

        <View style={S.footer}>
          <Text style={S.title}>{item.title}</Text>
          <View style={S.badge}>
            <Text style={S.badgeTxt}>{String(item.rating ?? 0).replace(".", ",")}</Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const S = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  imgWrap: { height: 190, backgroundColor: "#DDE6F0" },
  img: { width: "100%", height: "100%" },
  footer: { padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontWeight: "900", color: C.text, fontSize: 14 },
  badge: { backgroundColor: C.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeTxt: { fontWeight: "900", color: C.text },
});
