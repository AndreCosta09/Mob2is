import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
  ScrollView
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { fetchCategories, fetchPoisByCategory } from "../api/mockApi";

import Mob2isLogo from "../assets/logo/logo.svg";

const C = {
  bg: "#F3F5F7",
  text: "#0B2D4D",
  muted: "#6B7A88",
  green: "#39A25D",
  greenDark: "#2E8F50",
  pill: "#E9EDF2",
  white: "#FFFFFF",
  shadow: "rgba(0,0,0,0.12)",
  blue :"#1579B3",
};

const ASSETS = {
  placeholder:
    "https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1200&q=60",
};

function useScreenTransition(key) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [key, anim]);

  const style = {
    opacity: anim,
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [26, 0],
        }),
      },
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [6, 0],
        }),
      },
    ],
  };

  return style;
}

function AnimatedPressable({
  onPress,
  style,
  containerStyle,
  children,
  disabled,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable
     android_ripple={{ color: "rgba(5,31,65,0.06)" }} 
      hitSlop={8}
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={containerStyle}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}


function CategoryRow({ item, active, onPress }) {
  const a = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(a, {
      toValue: active ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, 
    }).start();
  }, [active, a]);

  const bg = a.interpolate({
    inputRange: [0, 1],
    outputRange: [C.pill, C.green],
  });

  const txt = a.interpolate({
    inputRange: [0, 1],
    outputRange: [C.text, C.white],
  });

  return (
      <AnimatedPressable
        onPress={onPress}
        containerStyle={styles.catPressable}
        style={[styles.catBtn, { backgroundColor: bg }]}
      >
        <Animated.Text style={[styles.catText, { color: txt }]}>{item.name}</Animated.Text>
      </AnimatedPressable>
    );




}

function PoiCard({ item, index, onPress }) {
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
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={style}>
      <AnimatedPressable onPress={onPress} style={styles.poiCard}>
        <View style={styles.poiImageWrap}>
          <Image
            source={{ uri: item.image ?? ASSETS.placeholder }}
            style={styles.poiImage}
            resizeMode="cover"
          />
      
  
        </View>

        <View style={styles.poiFooter}>
          <Text style={styles.poiFooterTitle}>{item.title}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>
              {String(item.rating ?? 0).replace(".", ",")}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function SearchScreen({ navigation }) {
  const tabBarH = useBottomTabBarHeight();

  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);

  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);

  const [loadingPois, setLoadingPois] = useState(false);


  const heroIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const c = await fetchCategories();
      setCategories(c);
    })();
  }, []);

  const viewKey = useMemo(() => {
    if (selectedPoi) return `detail-${selectedPoi.id}`;
    if (selectedCat) return `list-${selectedCat.id}`;
    return "cats";
  }, [selectedCat, selectedPoi]);

  const screenAnimStyle = useScreenTransition(viewKey);

  const pickCategory = async (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCat(cat);
    setSelectedPoi(null);

    setLoadingPois(true);
    const list = await fetchPoisByCategory(cat.id);
    setPois(list);
    setLoadingPois(false);
  };

  const back = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (selectedPoi) {
      setSelectedPoi(null);
      return;
    }
    setSelectedCat(null);
    setPois([]);
  };

  const openPoi = (poi) => {
    setSelectedPoi(poi);

    heroIn.setValue(0);
    Animated.spring(heroIn, {
      toValue: 1,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const goToMap = (poi) => {
    navigation.navigate("Explorar", { destination: poi });
  };



if (selectedPoi) {
  const bounce = {
    opacity: heroIn,
    transform: [
      {
        translateY: heroIn.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };


  const actionsBottom = tabBarH + 10;
  const actionsHeight = 170; 

  return (
    <View style={styles.page}>

      <View style={styles.greenHeader}>
        <Pressable onPress={back} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {selectedPoi.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        {/* CONTEÚDO COM SCROLL */}
        <Animated.ScrollView
          style={[{ flex: 1 }, bounce]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: actionsBottom + actionsHeight,
          }}
        >
          <View style={styles.detailHero}>
            <Image
              source={{ uri: selectedPoi.image ?? ASSETS.placeholder }}
              style={styles.detailHeroImg}
              resizeMode="cover"
            />
          </View>

          <View style={styles.detailBody}>
            <View style={styles.detailRow}>
              <View style={styles.metaPills}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>
                    ★ {String(selectedPoi.rating).replace(".", ",")}
                  </Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>👍</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>♿</Text>
                </View>
              </View>

              <Text style={styles.smallHint}>
                {selectedPoi.visits
                  ? `Visitas guiadas: ${selectedPoi.visits}`
                  : "Visitas guiadas por marcação"}
              </Text>
            </View>

            <Text style={styles.desc}>{selectedPoi.description}</Text>
          </View>
        </Animated.ScrollView>

        {/* BOTÕES FIXOS (SEM CARD) */}
        <View style={[styles.fixedActions, { bottom: actionsBottom }]}>
          <AnimatedPressable style={styles.primaryBtn} onPress={() => goToMap(selectedPoi)}>
            <Text style={styles.primaryBtnText}>Ir até ao local</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.secondaryBtn} onPress={() => {}}>
            <Text style={styles.secondaryBtnText}>Navegar pelo interior</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}





  if (selectedCat) {
    return (
      <View style={styles.page}>


        <View style={styles.greenHeader}>
          <Pressable onPress={back} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{selectedCat.name}</Text>
          <View style={{ width: 40 }} />

        </View>

        <Animated.View style={[{ flex: 1 }, screenAnimStyle]}>
          {loadingPois ? (
            <View style={{ padding: 14 }}>
              <Text style={{ color: C.muted, fontWeight: "800" }}>A carregar…</Text>
            </View>
          ) : (
            <FlatList
              data={pois}
              keyExtractor={(i) => String(i.id)}
              contentContainerStyle={{ 
                padding: 14, paddingBottom: tabBarH + 40 }}
              renderItem={({ item, index }) => (
                <PoiCard item={item} index={index} onPress={() => openPoi(item)} />
              )}
            />
          )}
        </Animated.View>
      </View>
    );
  }


  return (
    <View style={styles.page}>

      <View pointerEvents="none" style={styles.bgLogo}>
        <Mob2isLogo width={450} height={450} opacity={0.15} />
      </View>

      <Animated.View style={[{ flex: 1 }, screenAnimStyle]}>
        
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={
           <View style={{ paddingTop: 10, paddingBottom: 12 }}>
                  <View style={styles.handle} />
                  <Text style={styles.pageTitle}>Categorias</Text>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: tabBarH + 40 }}
          renderItem={({ item }) => (
            <CategoryRow item={item} active={false} onPress={() => pickCategory(item)} />
          )}


        />


      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

      bgLogo: {
      position: "absolute",
      left: -13,
      top: 200,
    },

      handle: {
      width: 56,
      height: 6,
      borderRadius: 999,
      backgroundColor: "rgba(102,112,128,0.25)", 
      alignSelf: "center",
      marginBottom: 10,
    },
    pageTitle: {
      textAlign: "center",
      color: C.text,
      fontWeight: "900",
      fontSize: 25,
      letterSpacing: 0.2,
    },


  greenHeader: {
    height: 70,
    backgroundColor: C.green,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 28, color: C.white, marginTop: -2 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: C.text,
    fontWeight: "900",
    fontSize: 18,
  },

  catPressable: {
    width: "100%",
    alignSelf: "stretch",
    marginBottom: 12,
  },

catBtn: {
  width: "100%",
  borderRadius: 18,
  paddingVertical: 16,
  paddingHorizontal: 18,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: C.pill,
  borderWidth: 1,
  borderColor: "rgba(102,112,128,0.18)",
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 1,
},


  catText: {
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",     
    fontSize: 14,
  },


  poiCard: {
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
  poiImageWrap: { height: 190, backgroundColor: "#DDE6F0" },
  poiImage: { width: "100%", height: "100%" },
  poiImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  poiPill: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  poiPillText: { fontWeight: "900", color: C.text, fontSize: 11 },
  poiFooter: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  poiFooterTitle: { fontWeight: "900", color: C.text, fontSize: 14 },
  ratingBadge: {
    backgroundColor: C.bg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratingBadgeText: { fontWeight: "900", color: C.text },




fixedActions: {
  position: "absolute",
  left: 14,
  right: 14,
  paddingTop: 10,
  paddingBottom: 30,
},

dockHandle: {
  width: 44,
  height: 5,
  borderRadius: 999,
  backgroundColor: "rgba(11,45,77,0.18)",
  alignSelf: "center",
  marginBottom: 12,
},




  detailWrap: { flex: 1 },
  detailHero: {
    margin: 14,
    borderRadius: 22,
    overflow: "hidden",
    height: 210,
    backgroundColor: "#DDE6F0",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  detailHeroImg: { width: "100%", height: "100%" },
  detailBody: { paddingHorizontal: 14, paddingBottom: 18 },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  metaPills: { flexDirection: "row", gap: 8, alignItems: "center" },
  metaPill: {
    backgroundColor: C.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  metaPillText: { fontWeight: "900", color: C.text },
  smallHint: { color: C.muted, fontWeight: "800", fontSize: 12 },

  desc: { color: "#1E2A36", lineHeight: 20, marginTop: 10, marginBottom: 16 },

  primaryBtn: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    marginBottom: 12,
  },
  primaryBtnText: { color: C.text, fontWeight: "900" },

  secondaryBtn: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  secondaryBtnText: { color: C.text, fontWeight: "900" },
});
