import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Defs, Mask, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CategoriasIcon from "../assets/categorias.svg";
import MaisIcon from "../assets/mais.svg";

const EMPTY_ROUTES = [];

const ICONS = {
  Explorar: require("../assets/navigate.png"),
};

const SIDE_PAD = 0;
const BAR_HEIGHT = 66;
const CORNER_R = 10;
const NOTCH_W = 100;
const NOTCH_DEPTH = 30;
const BALL_SIZE = 58;
const BALL_GAP = 5;

const ACTIVE_COLOR = "#F09C1F";
const INACTIVE_TINT = "#F09C1F";
const BAR_BG = "#FFFFFF";
const BAR_STROKE = "rgba(102,112,128,0.25)";

const CUT_DEPTH = Math.min(NOTCH_DEPTH, BALL_SIZE / 2 - BALL_GAP + 10);

function getNotchWidth(cx, barW) {
  const pad = 2;
  const left = cx - CORNER_R - pad;
  const right = barW - CORNER_R - pad - cx;
  const maxBySpace = Math.min(NOTCH_W, left * 2, right * 2);
  return Math.max(92, Math.min(NOTCH_W, maxBySpace));
}

function buildDentPath(cx, barW, depth) {
  const topY = 0;
  const notchW = getNotchWidth(cx, barW);

  const x1 = cx - notchW / 2;
  const x2 = cx + notchW / 2;
  const c1x = x1 + notchW * 0.2;
  const c2x = cx - notchW * 0.25;
  const c3x = cx + notchW * 0.25;
  const c4x = x2 - notchW * 0.2;

  return [
    `M ${x1} ${topY}`,
    `C ${c1x} ${topY}, ${c2x} ${depth}, ${cx} ${depth}`,
    `C ${c3x} ${depth}, ${c4x} ${topY}, ${x2} ${topY}`,
    `L ${x1} ${topY}`,
    "Z",
  ].join(" ");
}

function TabIcon({ routeName, color, size }) {
  if (routeName === "Pesquisar") {
    return <CategoriasIcon width={size} height={size} color={color} />;
  }

  if (routeName === "Mais") {
    return <MaisIcon width={size} height={size} color={color} />;
  }

  return (
    <Image
      source={ICONS[routeName]}
      style={[
        styles.iconImg,
        {
          width: size,
          height: size,
          tintColor: color,
        },
      ]}
    />
  );
}

export default function CustomTabBar(props) {
  const { state, descriptors, navigation } = props || {};
  const routes = state?.routes ?? EMPTY_ROUTES;
  const activeIndex = state?.index ?? 0;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const barW = Math.max(260, width - SIDE_PAD * 2);
  const tabW = routes.length ? barW / routes.length : barW;

  const centers = useMemo(
    () => routes.map((_, index) => tabW * (index + 0.5)),
    [routes, tabW]
  );

  const centerX = useRef(
    new Animated.Value(centers[activeIndex] ?? centers[0] ?? 0)
  ).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const dentMaskRef = useRef(null);
  const initialCx = centers[activeIndex] ?? centers[0] ?? barW / 2;
  const initialCutD = buildDentPath(initialCx, barW, CUT_DEPTH);

  useEffect(() => {
    const id = centerX.addListener(({ value }) => {
      dentMaskRef.current?.setNativeProps({
        d: buildDentPath(value, barW, CUT_DEPTH),
      });
    });

    return () => centerX.removeListener(id);
  }, [barW, centerX]);

  useEffect(() => {
    const to = centers[activeIndex] ?? centers[0];

    Animated.parallel([
      Animated.spring(centerX, {
        toValue: to,
        useNativeDriver: true,
        damping: 25,
        stiffness: 100,
        mass: 1,
      }),
      Animated.sequence([
        Animated.timing(bounceY, {
          toValue: -2,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(bounceY, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeIndex, bounceY, centerX, centers]);

  const ballTranslateX = Animated.subtract(centerX, BALL_SIZE / 2);
  const ballTop = -BALL_SIZE / 2 - BALL_GAP;
  const activeRouteName = routes[activeIndex]?.name;

  if (!routes.length) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      <View style={[styles.pillShadow, { width: barW, borderRadius: CORNER_R }]}>
        <Svg width={barW} height={BAR_HEIGHT} style={styles.svg}>
          <Defs>
            <Mask
              id="barMask"
              x={0}
              y={-80}
              width={barW}
              height={BAR_HEIGHT + 160}
              maskUnits="userSpaceOnUse"
            >
              <Rect
                x="0"
                y="0"
                width={barW}
                height={BAR_HEIGHT}
                rx={CORNER_R}
                ry={CORNER_R}
                fill="rgb(255, 255, 255)"
              />
              <Path ref={dentMaskRef} d={initialCutD} fill="black" />
            </Mask>
          </Defs>

          <Rect
            x="0"
            y="0"
            width={barW}
            height={BAR_HEIGHT}
            rx={CORNER_R}
            ry={CORNER_R}
            fill={BAR_BG}
            stroke={BAR_STROKE}
            mask="url(#barMask)"
          />
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.ballWrap,
            {
              top: ballTop,
              transform: [{ translateX: ballTranslateX }, { translateY: bounceY }],
            },
          ]}
        >
          <View style={styles.ball}>
            <TabIcon routeName={activeRouteName} color="#0B2D4D" size={25} />
          </View>
        </Animated.View>

        <View style={styles.row}>
          {routes.map((route, index) => {
            const isFocused = activeIndex === index;
            const label = descriptors[route.key]?.options?.tabBarLabel ?? route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab}>
                <View style={isFocused && styles.iconHidden}>
                  <TabIcon routeName={route.name} color={INACTIVE_TINT} size={30} />
                </View>
                <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    alignItems: "center",
    overflow: "visible",
  },
  pillShadow: {
    overflow: "visible",
    backgroundColor: "transparent",
  },
  svg: {
    backgroundColor: "transparent",
  },
  row: {
    position: "absolute",
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  tab: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },
  iconImg: {
    resizeMode: "contain",
    marginBottom: 6,
  },
  iconHidden: {
    opacity: 0,
  },
  label: {
    fontSize: 12,
    color: "#9AA3AD",
  },
  labelActive: {
    color: ACTIVE_COLOR,
    fontWeight: "900",
  },
  ballWrap: {
    position: "absolute",
    width: BALL_SIZE,
    height: BALL_SIZE,
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: ACTIVE_COLOR,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
});
