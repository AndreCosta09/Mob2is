import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import VisualIcon from "../assets/condicao/visual.svg";
import WheelchairIcon from "../assets/condicao/cadeira_rodas.svg";
import HearingIcon from "../assets/condicao/auditiva.svg";
import AutismIcon from "../assets/condicao/autismo.svg";
import StrollerIcon from "../assets/condicao/gravidas.svg";
import ElderIcon from "../assets/condicao/idoso.svg";

const CONDITIONS = [
  { key: "visual", label: "DEFICIÊNCIA VISUAL", color: "#FF6B57", Icon: VisualIcon },
  { key: "wheelchair", label: "CADEIRA DE RODAS", color: "#8BC34A", Icon: WheelchairIcon },
  { key: "hearing", label: "DEFICIÊNCIA AUDITIVA", color: "#9C7CF4", Icon: HearingIcon },
  { key: "asd", label: "ESPECTRO DE AUTISMO (PEA)", color: "#FFD166", Icon: AutismIcon },
  { key: "stroller", label: "GRÁVIDAS, CRIANÇAS E CARRINHOS", color: "#FF4D6D", Icon: StrollerIcon },
  { key: "elder", label: "IDOSO COM MOBILIDADE CONDICIONADA", color: "#4FC3F7", Icon: ElderIcon },
];




const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ConditionRow({ item, active, onPress }) {
  
  const [rowW, setRowW] = useState(0);
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, 
    }).start();
  }, [active, progress]);

 const MIN_FILL = 65; 
  const fillWidth = useMemo(() => {
    if (!rowW) return 0;
    return progress.interpolate({
      inputRange: [0, 1],
      outputRange: [MIN_FILL, rowW],
    });
  }, [progress, rowW]);


  const dotOpacity = useMemo(() => {
    return progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
  }, [progress]);

  const labelColor = active ? "#0B2D4D" : "#1E2A36";
  const Icon = item.Icon;
  
  return (
    <View style={styles.rowShadow}>
      <AnimatedPressable
        onLayout={(e) => setRowW(e.nativeEvent.layout.width)}
        onPress={onPress}
        onPressIn={() => {
          Animated.spring(scale, {
            toValue: 0.985,
            useNativeDriver: true,
            speed: 30,
            bounciness: 0,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 24,
            bounciness: 6,
          }).start();
        }}
        android_ripple={{ color: "rgba(0,0,0,0.05)" }}
        style={[
          styles.rowInner,
          { transform: [{ scale }] },
          active && styles.rowInnerActive,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.rowFill,
            {
              backgroundColor: item.color,
              width: fillWidth,
            },
          ]}
        />

        <View style={styles.rowContent}>


         <View style={[styles.iconBox, { backgroundColor: "transparent" }]}>
            <Icon
              width={32}
              height={32}
              fill="none"

            />

          </View>

          <Text style={[styles.label, { color: labelColor }]} numberOfLines={2}>
            {item.label}
          </Text>

          <View style={[styles.radio, active && styles.radioActive]}>
            <Animated.View style={[styles.radioDot, { opacity: dotOpacity }]} />
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
}

export default function OnboardingScreen({ onDone }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);

  return (
    <View style={[styles.page, { paddingTop: 18 + insets.top }]}>
      <View pointerEvents="none" style={styles.bgBlobTop} />
      <View pointerEvents="none" style={styles.bgBlobBottom} />

      <Text style={styles.title}>
        Qual é a sua{"\n"}
        <Text style={styles.titleStrong}>condição?</Text>
      </Text>

      <View style={styles.list}>
        {CONDITIONS.map((c) => {
          const active = selected === c.key;
          return (
            <ConditionRow
              key={c.key}
              item={c}
              active={active}
              onPress={() => setSelected(c.key)}
            />
          );
        })}
      </View>

      <Pressable
        disabled={!selected}
        onPress={() => onDone?.(selected)}
        style={[styles.btn, !selected && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>Iniciar Rota</Text>
      </Pressable>
    </View>
  );
}

const CARD_R = 18;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F5F7",
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  bgBlobTop: {
    position: "absolute",
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 200,
    backgroundColor: "rgba(11,45,77,0.06)",
  },
  bgBlobBottom: {
    position: "absolute",
    bottom: -140,
    left: -110,
    width: 320,
    height: 320,
    borderRadius: 220,
    backgroundColor: "rgba(241,143,1,0.08)",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0B2D4D",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  titleStrong: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0B2D4D",
  },

  list: { gap: 12 },


  rowShadow: {
    borderRadius: CARD_R,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  rowInner: {
    borderRadius: CARD_R,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.06)",
  },
  rowInnerActive: {
    borderColor: "rgba(11,45,77,0.10)",
  },

  rowFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.85,
  },

  rowContent: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
     width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,

  },
  icon: { fontSize: 20 },

  label: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(11,45,77,0.20)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  radioActive: {
    borderColor: "rgba(11,45,77,0.45)",
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#0B2D4D",
  },

  btn: {
    marginTop: 18,
    backgroundColor: "#F18F01",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: {
    color: "#0B2D4D",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.3,
  },
});
