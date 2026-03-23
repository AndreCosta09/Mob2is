import React, { useContext, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { UserContext } from "../context/UserContext";
import { getAppPalette, getMotionDuration } from "../utils/accessibility";

const ICONS = {
  route: require("../assets/route.png"),
  settings: require("../assets/settings.png"),
  terms: require("../assets/terms.png"),
};

function MenuItem({ title, subtitle, icon, onPress, index, colors, reduceMotion }) {
  const inAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      inAnim.setValue(1);
      return;
    }

    const transition = Animated.timing(inAnim, {
      toValue: 1,
      duration: getMotionDuration(reduceMotion, 420),
      delay: 80 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    transition.start();
    return () => transition.stop();
  }, [inAnim, index, reduceMotion]);

  const pressIn = () => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue: 0.985, useNativeDriver: true }).start();
  };

  const pressOut = () => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

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
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
          >
            <Image source={icon} style={styles.icon} resizeMode="contain" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
            {!!subtitle && <Text style={[styles.itemSubtitle, { color: colors.muted }]}>{subtitle}</Text>}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MoreScreen({ navigation }) {
  const tabBarH = useBottomTabBarHeight();
  const headerIn = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();
  const { preferences } = useContext(UserContext) ?? {};
  const reduceMotion = !!preferences?.reduceMotion;
  const colors = useMemo(() => getAppPalette(!!preferences?.highContrast), [preferences?.highContrast]);

  useEffect(() => {
    if (reduceMotion) {
      headerIn.setValue(1);
      return;
    }

    const transition = Animated.timing(headerIn, {
      toValue: 1,
      duration: getMotionDuration(reduceMotion, 420),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    transition.start();
    return () => transition.stop();
  }, [headerIn, reduceMotion]);

  return (
    <View style={[styles.page, { paddingBottom: tabBarH + 18, backgroundColor: colors.bg }]}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerIn,
            transform: [
              { translateY: headerIn.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
            ],
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.hTitle, { color: colors.text }]}>{t("more.title")}</Text>
        <Text style={[styles.hSubtitle, { color: colors.muted }]}>{t("more.subtitle")}</Text>
      </Animated.View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MenuItem
          index={0}
          title={t("more.items.route.title")}
          subtitle={t("more.items.route.subtitle")}
          icon={ICONS.route}
          onPress={() => navigation.navigate("RoutePlanner")}
          colors={colors}
          reduceMotion={reduceMotion}
        />

        <View style={[styles.sep, { backgroundColor: colors.border }]} />

        <MenuItem
          index={1}
          title={t("more.items.settings.title")}
          subtitle={t("more.items.settings.subtitle")}
          icon={ICONS.settings}
          onPress={() => navigation.navigate("Settings")}
          colors={colors}
          reduceMotion={reduceMotion}
        />

        <View style={[styles.sep, { backgroundColor: colors.border }]} />

        <MenuItem
          index={2}
          title={t("more.items.terms.title")}
          subtitle={t("more.items.terms.subtitle")}
          icon={ICONS.terms}
          onPress={() => navigation.navigate("Terms")}
          colors={colors}
          reduceMotion={reduceMotion}
        />
      </View>
      <View style={{ height: 14 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  header: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  hTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  hSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
  },
  card: {
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  icon: {
    width: 30,
    height: 30,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  itemSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
  },
  sep: {
    height: 1,
    marginHorizontal: 6,
  },
});
