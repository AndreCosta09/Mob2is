import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";


const C = {
  bg: "#F3F5F7",
  text: "#0B2D4D",
  muted: "rgba(11,45,77,0.62)",
  card: "#FFFFFF",
  stroke: "rgba(11,45,77,0.08)",
  orange: "#F09C1F",
  blueDark: "#051F41",
};

const KEY_PREFS = "mob2is_prefs_v1";
const KEY_LANG = "mob2is_lang_v1";

function Row({ title, subtitle, right }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segBtn, active && styles.segBtnActive]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();


  const [prefs, setPrefs] = useState({
    notifications: true,
    useLocation: true,
    reduceMotion: false,
    highContrast: false,
  });

  const [lang, setLang] = useState(i18n.language || "pt");

  useEffect(() => {
    (async () => {
      const [[, rawPrefs], [, storedLang]] = await AsyncStorage.multiGet([KEY_PREFS, KEY_LANG]);
      if (rawPrefs) {
        try { setPrefs(JSON.parse(rawPrefs)); } catch {}
      }
      if (storedLang) {
        setLang(storedLang);
        i18n.changeLanguage(storedLang);
      }
    })();
  }, []);

  const savePrefs = async (next) => {
    setPrefs(next);
    try {
      await AsyncStorage.setItem(KEY_PREFS, JSON.stringify(next));
    } catch {}
  };

  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    savePrefs(next);
  };

  const changeLang = async (nextLang) => {
    setLang(nextLang);
    i18n.changeLanguage(nextLang);
    try {
      await AsyncStorage.setItem(KEY_LANG, nextLang);
    } catch {}
  };

  const topPad = useMemo(() => Math.max(insets.top, 12), [insets.top]);

  return (
    <View style={[styles.page, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t("settings.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("settings.section.language")}</Text>

          <Row
            title={t("settings.language")}
            subtitle={t("settings.language_sub")}
            right={
              <Segmented
                value={lang}
                options={[
                  { label: "PT", value: "pt" },
                  { label: "EN", value: "en" },
                ]}
                onChange={changeLang}
              />
            }
          />
        </View>

        <View style={{ height: 12 }} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("settings.section.general")}</Text>

          <Row
            title={t("settings.notifications")}
            subtitle={t("settings.notifications_sub")}
            right={<Switch value={prefs.notifications} onValueChange={() => toggle("notifications")} />}
          />

          <View style={styles.sep} />

          <Row
            title={t("settings.location")}
            subtitle={t("settings.location_sub")}
            right={<Switch value={prefs.useLocation} onValueChange={() => toggle("useLocation")} />}
          />
        </View>

        <View style={{ height: 12 }} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("settings.section.accessibility")}</Text>

          <Row
            title={t("settings.reduce_motion")}
            subtitle={t("settings.reduce_motion_sub")}
            right={<Switch value={prefs.reduceMotion} onValueChange={() => toggle("reduceMotion")} />}
          />

          <View style={styles.sep} />

          <Row
            title={t("settings.high_contrast")}
            subtitle={t("settings.high_contrast_sub")}
            right={<Switch value={prefs.highContrast} onValueChange={() => toggle("highContrast")} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 14 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.stroke,
    alignItems: "center",
    justifyContent: "center",
  },
  backTxt: { fontSize: 26, fontWeight: "900", color: C.text, marginTop: -2 },
  title: { fontSize: 18, fontWeight: "900", color: C.text },

  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: C.stroke,
  },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: C.muted, marginBottom: 10 },

  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 6 },
  rowTitle: { fontSize: 14, fontWeight: "900", color: C.text },
  rowSub: { marginTop: 2, fontSize: 12, fontWeight: "800", color: C.muted },

  sep: { height: 1, backgroundColor: "rgba(11,45,77,0.08)", marginHorizontal: 6 },

  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(11,45,77,0.06)",
    borderRadius: 14,
    padding: 3,
  },
  segBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  segBtnActive: { backgroundColor: C.blueDark },
  segText: { fontWeight: "900", color: "rgba(11,45,77,0.70)", fontSize: 12 },
  segTextActive: { color: "#FFFFFF" },
});
