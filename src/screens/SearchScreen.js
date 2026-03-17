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

import { C, ASSETS } from "./search/constants";
import useScreenTransition from "./search/useScreenTransition";
import AnimatedPressable from "./search/AnimatedPressable";
import CategoryRow from "./search/CategoryRow";
import PoiCard from "./search/PoiCard";

import { fetchCategories, fetchPoisByCategory, getApiErrorMessage } from "../api/mockApi";

import Mob2isLogo from "../assets/logo/logo.svg";

import { useTranslation } from "react-i18next";


export default function SearchScreen({ navigation }) {
  const tabBarH = useBottomTabBarHeight();

  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);

  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [categoriesErrorMessage, setCategoriesErrorMessage] = useState("");
  const [poisErrorMessage, setPoisErrorMessage] = useState("");

  const [loadingPois, setLoadingPois] = useState(false);

  const [actionsH, setActionsH] = useState(0);

  const heroIn = useRef(new Animated.Value(0)).current;

  const { t } = useTranslation();

  const categoriesUi = useMemo(() => {
  return categories.map((cat) => ({
    ...cat,
    name: t(`categories.${cat.key}`, { defaultValue: cat.name }),
  }));
}, [categories, t]);



  const norm = (s = "") =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .toLowerCase()
      .trim();

  const categoryKeyFromName = (name = "") => {
    const n = norm(name);
    if (n.includes("cultur")) return "culture";
    if (n.includes("saud") || n.includes("hospital") || n.includes("clin")) return "health";
    if (n.includes("transp") || n.includes("autocar") || n.includes("comboio")) return "transport";
    if (n.includes("servic") || n.includes("public")) return "public_services";
    if (n.includes("turism")) return "tourism";

    return "other";
  };






  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const c = await fetchCategories();
        setCategories(
          c.map((cat) => ({
            ...cat,
            key: cat.key ?? categoryKeyFromName(cat.name),
          }))
        );
        setCategoriesErrorMessage("");
      } catch (error) {
        setCategories([]);
        setCategoriesErrorMessage(
          getApiErrorMessage(error, "Nao foi possivel carregar as categorias.")
        );
      }
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
    setPoisErrorMessage("");

    setLoadingPois(true);
    try {
      const list = await fetchPoisByCategory(cat.id);
      setPois(list);
      setPoisErrorMessage("");
    } catch (error) {
      setPois([]);
      setPoisErrorMessage(
        getApiErrorMessage(error, "Nao foi possivel carregar os locais desta categoria.")
      );
    } finally {
      setLoadingPois(false);
    }
  };

  const back = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (selectedPoi) {
      setSelectedPoi(null);
      return;
    }
    setSelectedCat(null);
    setPois([]);
    setPoisErrorMessage("");
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
const actionsFallback = 170; 
const actionsTotal = actionsBottom + (actionsH || actionsFallback) + 10;



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
       <Animated.ScrollView
            style={[{ flex: 1, marginBottom: actionsTotal }, bounce]}   
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ bottom: actionsTotal }}          
            contentContainerStyle={{ paddingBottom: 24 }}             
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
                    ? t("search.guided_visits", { count: selectedPoi.visits })
                    : t("search.guided_visits_booking")}
              </Text>
            </View>

            <Text style={styles.desc}>{selectedPoi.description}</Text>
          </View>
        </Animated.ScrollView>

        <View
            style={[styles.fixedActions, { bottom: actionsBottom }]}
            onLayout={(e) => setActionsH(e.nativeEvent.layout.height)}
          >

          <AnimatedPressable style={styles.primaryBtn} onPress={() => goToMap(selectedPoi)}>
            <Text style={styles.primaryBtnText}>{t("search.go_to_place")}</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.secondaryBtn} onPress={() => {}}>
            <Text style={styles.secondaryBtnText}>{t("search.navigate_inside")}</Text>
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
          <Text style={styles.headerTitle}> {t(`categories.${selectedCat.key}`, { defaultValue: selectedCat.name })}</Text>  
          <View style={{ width: 40 }} />

        </View>

        <Animated.View style={[{ flex: 1 }, screenAnimStyle]}>
          {loadingPois ? (
            <View style={{ padding: 14 }}>
              <Text style={{ color: C.muted, fontWeight: "800" }}>{t("common.loading")}</Text>
            </View>
          ) : poisErrorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{poisErrorMessage}</Text>
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
        {categoriesErrorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{categoriesErrorMessage}</Text>
          </View>
        ) : null}

        <FlatList
          data={categoriesUi}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={
           <View style={{ paddingTop: 10, paddingBottom: 12 }}>
                  <View style={styles.handle} />
                  <Text style={styles.pageTitle}>{t("categories.title")}</Text>
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
  errorBox: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFF4E8",
    borderWidth: 1,
    borderColor: "rgba(241,143,1,0.26)",
  },
  errorText: {
    color: "#8A4B00",
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },

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
