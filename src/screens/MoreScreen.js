import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";

const C = {
  bg: "#F3F5F7",
  text: "#0B2D4D",
  muted: "rgba(11,45,77,0.62)",
  card: "#FFFFFF",
  stroke: "rgba(11,45,77,0.08)",
  orange: "#f69c0aff",
  orange2: "#F6B544",
};

const ICONS = {
  route: require("../assets/route.png"),
  settings: require("../assets/settings.png"),
  terms: require("../assets/terms.png"),
};

function MenuItem({ title, subtitle, icon, onPress, index }) {
  const inAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(inAnim, {
      toValue: 1,
      duration: 420,
      delay: 80 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [inAnim, index]);

  const pressIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={{
        opacity: inAnim,
        transform: [
          { translateY: inAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          { scale },
        ],
      }}
    >
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <View style={styles.item}>
          <View style={styles.iconWrap}>
            <Image source={icon} style={styles.icon} resizeMode="contain" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{title}</Text>
            {!!subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
          </View>

          <Text style={styles.chev}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MoreScreen({ navigation }) {
  const tabBarH = useBottomTabBarHeight();
  const headerIn = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  useEffect(() => {
    Animated.timing(headerIn, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headerIn]);

  return (
    <View style={[styles.page, { paddingBottom: tabBarH + 18 }]}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerIn,
            transform: [
              { translateY: headerIn.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
            ],
          },
        ]}
      >
        <Text style={styles.hTitle}>{t("more.title")}</Text>
        <Text style={styles.hSubtitle}>{t("more.subtitle")}</Text>
      </Animated.View>

      <View style={styles.card}>
        <MenuItem
          index={0}
          title={t("more.items.route.title")}
          subtitle={t("more.items.route.subtitle")}
          icon={ICONS.route}
          onPress={() => {
            console.log("Programar Percurso");
          }}
        />

        <View style={styles.sep} />

        <MenuItem
          index={1}
          title={t("more.items.settings.title")}
          subtitle={t("more.items.settings.subtitle")}
          icon={ICONS.settings}
          onPress={() => navigation.navigate("Settings")}

        />

        <View style={styles.sep} />

        <MenuItem
          index={2}
          title={t("more.items.terms.title")}
          subtitle={t("more.items.terms.subtitle")}
          icon={ICONS.terms}
          onPress={() => console.log("Termos e Condições")}
        />
      </View>
      <View style={{ height: 14 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    paddingTop: 14,
  },

 header: {
  borderRadius: 18,
  paddingVertical: 14,
  paddingHorizontal: 16,
  marginBottom: 12,
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "rgba(11,45,77,0.08)",
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
},
  hTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text, 
  },
  hSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(11,45,77,0.70)",
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
  },

  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(11,45,77,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: C.stroke,
  },
  icon: { width: 30, height: 30},

  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: C.text,
  },
  itemSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: C.muted,
  },

  chev: {
    fontSize: 22,
    fontWeight: "900",
    color: "rgba(11,45,77,0.28)",
    marginLeft: 8,
  },

  sep: {
    height: 1,
    backgroundColor: "rgba(11,45,77,0.08)",
    marginHorizontal: 6,
  },
});
