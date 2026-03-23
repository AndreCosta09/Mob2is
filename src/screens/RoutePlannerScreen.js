import React, { useContext } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { UserContext } from "../context/UserContext";
import {
  CONDITIONS,
  getConditionOption,
  ROUTE_PREFERENCES,
} from "../utils/userProfileOptions";

const C = {
  bg: "#F3F5F7",
  text: "#0B2D4D",
  muted: "rgba(11,45,77,0.62)",
  card: "#FFFFFF",
  stroke: "rgba(11,45,77,0.08)",
  orange: "#F09C1F",
};

function RoutePreferenceRow({ item, selected, onPress }) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={styles.optionRow}>
      <View style={styles.rowTextWrap}>
        <Text style={styles.optionText}>{t(`routePlanner.preferences.${item.key}.label`)}</Text>
        <Text style={styles.optionSub}>{t(`routePlanner.preferences.${item.key}.subtitle`)}</Text>
      </View>

      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function ConditionSummaryRow({ item }) {
  const Icon = item.Icon;
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, styles.iconWrapLarge, { backgroundColor: item.color }]}>
        <Icon width={28} height={28} />
      </View>

      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{t("routePlanner.current_condition")}</Text>
        <Text style={styles.rowSub}>{t(`onboarding.conditions.${item.key}`)}</Text>
      </View>
    </View>
  );
}

function ConditionOptionRow({ item, selected, onPress }) {
  const Icon = item.Icon;
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={styles.optionRow}>
      <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
        <Icon width={26} height={26} />
      </View>

      <Text style={styles.optionText}>{t(`onboarding.conditions.${item.key}`)}</Text>

      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function RoutePlannerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarH = useBottomTabBarHeight();
  const { t } = useTranslation();
  const {
    condition,
    routePreference,
    saveCondition,
    saveRoutePreference,
  } = useContext(UserContext) ?? {};

  const selectedCondition = getConditionOption(condition);

  const handleConditionChange = (nextCondition) => {
    if (!nextCondition || nextCondition === condition) return;

    Alert.alert(
      t("routePlanner.confirm_condition_title"),
      t("routePlanner.confirm_condition_message"),
      [
        { text: t("routePlanner.confirm_condition_cancel"), style: "cancel" },
        {
          text: t("routePlanner.confirm_condition_confirm"),
          onPress: () => saveCondition?.(nextCondition),
        },
      ]
    );
  };

  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>{"<"}</Text>
        </Pressable>
        <Text style={styles.title}>{t("routePlanner.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarH + 28 },
        ]}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("routePlanner.current_condition")}</Text>
          <ConditionSummaryRow item={selectedCondition} />
        </View>

        <View style={styles.blockSpacer} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("routePlanner.change_condition")}</Text>

          {CONDITIONS.map((item, index) => (
            <View key={item.key}>
              <ConditionOptionRow
                item={item}
                selected={condition === item.key}
                onPress={() => handleConditionChange(item.key)}
              />
              {index < CONDITIONS.length - 1 ? <View style={styles.sep} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.blockSpacer} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("routePlanner.route_preference")}</Text>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{t("routePlanner.selected_route_label")}</Text>
              <Text style={styles.rowSub}>{t("routePlanner.selected_route_description")}</Text>
            </View>
          </View>

          {ROUTE_PREFERENCES.map((item, index) => (
            <View key={item.key}>
              <RoutePreferenceRow
                item={item}
                selected={routePreference === item.key}
                onPress={() => saveRoutePreference?.(item.key)}
              />
              {index < ROUTE_PREFERENCES.length - 1 ? <View style={styles.sep} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  scroll: {
    flex: 1,
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
  backTxt: {
    fontSize: 26,
    fontWeight: "900",
    color: C.text,
    marginTop: -2,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: C.text,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  blockSpacer: {
    height: 12,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: C.stroke,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: C.muted,
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
    color: C.text,
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: C.muted,
    lineHeight: 18,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconWrapLarge: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: C.text,
  },
  optionSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: C.muted,
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
    borderColor: C.orange,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.orange,
  },
  sep: {
    height: 1,
    backgroundColor: "rgba(11,45,77,0.08)",
    marginHorizontal: 6,
  },
});
