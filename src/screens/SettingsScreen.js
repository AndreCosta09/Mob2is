import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { UserContext } from "../context/UserContext";
import BackButton from "../components/BackButton";
import { getAppPalette } from "../utils/accessibility";

const KEY_LANG = "mob2is_lang_v1";

function Row({ title, subtitle, right, colors }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.rowSub, { color: colors.muted }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

function Segmented({ value, options, onChange, colors }) {
  return (
    <View style={[styles.segment, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segBtn,
              active && {
                backgroundColor: colors.highContrast ? colors.text : colors.accentText,
              },
            ]}
          >
            <Text
              style={[
                styles.segText,
                { color: colors.muted },
                active && {
                  color: colors.surface,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { preferences, updatePreference } = useContext(UserContext) ?? {};
  const prefs = preferences ?? {};
  const [lang, setLang] = useState(i18n.language || "pt");
  const colors = useMemo(() => {
    const palette = getAppPalette(!!prefs.highContrast);
    return {
      ...palette,
      highContrast: !!prefs.highContrast,
    };
  }, [prefs.highContrast]);

  useEffect(() => {
    (async () => {
      const [[, storedLang]] = await AsyncStorage.multiGet([
        KEY_LANG,
      ]);

      if (storedLang) {
        setLang(storedLang);
        i18n.changeLanguage(storedLang);
      }
    })();
  }, [i18n]);

  const toggle = (key) => {
    updatePreference?.(key, !prefs[key]);
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
    <View style={[styles.page, { paddingTop: topPad, backgroundColor: colors.bg }]}>
      <View style={styles.topBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: colors.text }]}>{t("settings.title")}</Text>
        <View style={styles.sidePlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t("settings.section.language")}</Text>

          <Row
            title={t("settings.language")}
            subtitle={t("settings.language_sub")}
            colors={colors}
            right={
              <Segmented
                value={lang}
                options={[
                  { label: "PT", value: "pt" },
                  { label: "EN", value: "en" },
                ]}
                onChange={changeLang}
                colors={colors}
              />
            }
          />
        </View>

        <View style={styles.blockSpacer} />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t("settings.section.general")}</Text>

          <Row
            title={t("settings.notifications")}
            subtitle={t("settings.notifications_sub")}
            colors={colors}
            right={
              <Switch
                value={prefs.notifications}
                onValueChange={() => toggle("notifications")}
                trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
                thumbColor={prefs.notifications ? colors.surface : colors.surface}
              />
            }
          />

          <View style={[styles.sep, { backgroundColor: colors.border }]} />

          <Row
            title={t("settings.location")}
            subtitle={t("settings.location_sub")}
            colors={colors}
            right={
              <Switch
                value={prefs.useLocation}
                onValueChange={() => toggle("useLocation")}
                trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
                thumbColor={prefs.useLocation ? colors.surface : colors.surface}
              />
            }
          />
        </View>

        <View style={styles.blockSpacer} />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t("settings.section.accessibility")}</Text>

          <Row
            title={t("settings.reduce_motion")}
            subtitle={t("settings.reduce_motion_sub")}
            colors={colors}
            right={
              <Switch
                value={prefs.reduceMotion}
                onValueChange={() => toggle("reduceMotion")}
                trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
                thumbColor={prefs.reduceMotion ? colors.surface : colors.surface}
              />
            }
          />

          <View style={[styles.sep, { backgroundColor: colors.border }]} />

          <Row
            title={t("settings.high_contrast")}
            subtitle={t("settings.high_contrast_sub")}
            colors={colors}
            right={
              <Switch
                value={prefs.highContrast}
                onValueChange={() => toggle("highContrast")}
                trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
                thumbColor={prefs.highContrast ? colors.surface : colors.surface}
              />
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  sidePlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  blockSpacer: {
    height: 12,
  },
  card: {
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
  },
  sep: {
    height: 1,
    marginHorizontal: 6,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
  },
  segBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  segText: {
    fontWeight: "900",
    fontSize: 12,
  },
  segTextActive: {
    color: "#FFFFFF",
  },
});
