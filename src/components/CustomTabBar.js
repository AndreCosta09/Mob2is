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
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS = {
  Explorar: require("../assets/navigate.png"),
  Pesquisar: require("../assets/search.png"),
  Mais: require("../assets/mais.png"),
};


const SIDE_PAD = 34;         
const BAR_HEIGHT = 66;
const CORNER_R = 26;

const NOTCH_W = 120;         
const NOTCH_DEPTH = 26;      

const BALL_SIZE = 56;
const BALL_INNER = 40;
const GAP = 8;              

const ACTIVE_COLOR = "#2C6BFF";
const INACTIVE_TINT = "#AAB4BF";


function buildDownNotchPath(width, height, r, cx, notchW, depth) {
  const topY = 0;
  const bottomY = height;

  const x1 = cx - notchW / 2;
  const x2 = cx + notchW / 2;

  const c1x = x1 + notchW * 0.20;
  const c2x = cx - notchW * 0.25;
  const c3x = cx + notchW * 0.25;
  const c4x = x2 - notchW * 0.20;

  return [
    `M ${r} ${topY}`,
    `L ${x1} ${topY}`,
    `C ${c1x} ${topY}, ${c2x} ${depth}, ${cx} ${depth}`,
    `C ${c3x} ${depth}, ${c4x} ${topY}, ${x2} ${topY}`,
    `L ${width - r} ${topY}`,
    `A ${r} ${r} 0 0 1 ${width} ${topY + r}`,
    `L ${width} ${bottomY - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${bottomY}`,
    `L ${r} ${bottomY}`,
    `A ${r} ${r} 0 0 1 0 ${bottomY - r}`,
    `L 0 ${topY + r}`,
    `A ${r} ${r} 0 0 1 ${r} ${topY}`,
    "Z",
  ].join(" ");
}

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const routesLen = state.routes.length;
  const usableW = width - SIDE_PAD * 2;
  const tabW = usableW / routesLen;


  const rawCenters = useMemo(
    () => state.routes.map((_, i) => SIDE_PAD + tabW * (i + 0.5)),
    [state.routes.length, tabW]
  );


  const minCx = CORNER_R + NOTCH_W / 2 + 6;
  const maxCx = width - (CORNER_R + NOTCH_W / 2 + 6);
  const clampCx = (v) => Math.max(minCx, Math.min(v, maxCx));


  const centers = useMemo(() => rawCenters.map(clampCx), [rawCenters.join("|"), width]);
  const centerX = useRef(new Animated.Value(centers[state.index] ?? centers[0])).current;
  const bounceY = useRef(new Animated.Value(0)).current;

  const pathRef = useRef(null);

  const initialCx = centers[state.index] ?? centers[0];
  const initialD = buildDownNotchPath(width, BAR_HEIGHT, CORNER_R, initialCx, NOTCH_W, NOTCH_DEPTH);


  useEffect(() => {
    const id = centerX.addListener(({ value }) => {
      const cx = clampCx(value);
      const d = buildDownNotchPath(width, BAR_HEIGHT, CORNER_R, cx, NOTCH_W, NOTCH_DEPTH);
      pathRef.current?.setNativeProps({ d });
    });
    return () => centerX.removeListener(id);
  }, [centerX, width]);


  useEffect(() => {
    const to = centers[state.index] ?? centers[0];

    Animated.parallel([
      Animated.spring(centerX, {
        toValue: to,
        useNativeDriver: true,
        damping: 18,
        stiffness: 170,
        mass: 1,
      }),
      Animated.sequence([
        Animated.timing(bounceY, { toValue: -6, duration: 120, useNativeDriver: true }),
        Animated.timing(bounceY, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]),
    ]).start();
  }, [state.index, centers]);

  const ballTranslateX = Animated.subtract(centerX, BALL_SIZE / 2);

  const ballTop = -BALL_SIZE / 2 - GAP;

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.shadowHost}>
  
        <Svg width={width} height={BAR_HEIGHT} style={styles.svg}>
          <Path ref={pathRef} d={initialD} fill="#FFFFFF" />
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
          <View style={styles.ballOuter}>
            <View style={styles.ballInner}>
              <Image source={ICONS[activeRouteName]} style={styles.ballImg} />
            </View>
          </View>
        </Animated.View>

      
        <View style={[styles.row, { paddingHorizontal: SIDE_PAD }]}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const label = descriptors[route.key]?.options?.tabBarLabel ?? route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab}>
                <Image
                  source={ICONS[route.name]}
                  style={[styles.iconImg, isFocused && styles.iconHidden]}
                />
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
    backgroundColor: "transparent",
    overflow: "visible",
  },
  shadowHost: {
    elevation: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    overflow: "visible",
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
    width: 28,
    height: 28,
    resizeMode: "contain",
    marginBottom: 6,
  },
  iconHidden: { opacity: 0 },

  label: { fontSize: 12, color: "#9AA3AD" },
  labelActive: { color: ACTIVE_COLOR, fontWeight: "900" },

  ballWrap: {
    position: "absolute",
    width: BALL_SIZE,
    height: BALL_SIZE,
  },
  ballOuter: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 30,
  },
  ballInner: {
    width: BALL_INNER,
    height: BALL_INNER,
    borderRadius: BALL_INNER / 2,
    backgroundColor: ACTIVE_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  ballImg: {
    width: 22,
    height: 22,
    resizeMode: "contain",

  },
});
