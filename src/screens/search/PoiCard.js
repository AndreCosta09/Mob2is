import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import AnimatedPressable from "./AnimatedPressable";
import { ASSETS, C } from "./constants";

export default function PoiCard({ item, index, onPress }) {
  const enter = useRef(new Animated.Value(0)).current;
  const [imageFailed, setImageFailed] = useState(false);

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
          <Image
            source={item.image && !imageFailed ? { uri: item.image } : ASSETS.placeholder}
            style={S.img}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        </View>

        <View style={S.footer}>
          <View style={S.titleWrap}>
            <Text style={S.title} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
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
  footer: {
    minHeight: 58,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  title: {
    fontWeight: "900",
    color: C.text,
    fontSize: 14,
    lineHeight: 18,
  },
  badge: {
    flexShrink: 0,
    minWidth: 42,
    minHeight: 34,
    backgroundColor: C.bg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTxt: { fontWeight: "900", color: C.text },
});
