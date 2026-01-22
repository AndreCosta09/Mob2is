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
import Svg, { Defs, Mask, Rect, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS = {
  Explorar: require("../assets/navigate.png"),
  Pesquisar: require("../assets/search.png"),
  Mais: require("../assets/mais.png"),
};

const SIDE_PAD = 20;
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
const NOTCH_STROKE = "rgba(11, 45, 77, 0.10)";


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

  const c1x = x1 + notchW * 0.20;
  const c2x = cx - notchW * 0.25;
  const c3x = cx + notchW * 0.25;
  const c4x = x2 - notchW * 0.20;

  return [
    `M ${x1} ${topY}`,
    `C ${c1x} ${topY}, ${c2x} ${depth}, ${cx} ${depth}`,
    `C ${c3x} ${depth}, ${c4x} ${topY}, ${x2} ${topY}`,
    `L ${x1} ${topY}`,
    "Z",
  ].join(" ");
}

export default function CustomTabBar(props) {
  const { state, descriptors, navigation } = props || {};
  if (!state?.routes?.length) return null;

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const routesLen = state.routes.length;

  const barW = Math.max(260, width - SIDE_PAD * 2);
  const tabW = barW / routesLen;

  const centers = useMemo(
    () => state.routes.map((_, i) => tabW * (i + 0.5)),
    [state.routes.length, tabW]
  );

  const centerX = useRef(
    new Animated.Value(centers[state.index] ?? centers[0])
  ).current;
  const bounceY = useRef(new Animated.Value(0)).current;

  const dentMaskRef = useRef(null);
  const dentStrokeRef = useRef(null);

  const initialCx = centers[state.index] ?? centers[0];
  const initialCutD = buildDentPath(initialCx, barW, CUT_DEPTH);
  const initialDeepD = buildDentPath(initialCx, barW, NOTCH_DEPTH);

  useEffect(() => {
    const id = centerX.addListener(({ value }) => {

      const cutD = buildDentPath(value, barW, CUT_DEPTH);
      dentMaskRef.current?.setNativeProps({ d: cutD });

  
      const deepD = buildDentPath(value, barW, NOTCH_DEPTH);
      dentStrokeRef.current?.setNativeProps({ d: deepD });
    });
    return () => centerX.removeListener(id);
  }, [centerX, barW]);

  useEffect(() => {
    const to = centers[state.index] ?? centers[0];

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
  }, [state.index, centers]);

  const ballTranslateX = Animated.subtract(centerX, BALL_SIZE / 2);
  const ballTop = -BALL_SIZE / 2 - BALL_GAP;

  const activeRouteName = state.routes[state.index]?.name;

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
            <Image source={ICONS[activeRouteName]} style={styles.ballImg} />
          </View>
        </Animated.View>

        <View style={styles.row}>
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

  svg: { backgroundColor: "transparent" },

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
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginBottom: 6,
    tintColor: INACTIVE_TINT,
  },
  iconHidden: { opacity: 0 },

  label: { fontSize: 12, color: "#9AA3AD" },
  labelActive: { color: ACTIVE_COLOR, fontWeight: "900" },

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

  ballImg: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    tintColor: "#0B2D4D",
  },
});
