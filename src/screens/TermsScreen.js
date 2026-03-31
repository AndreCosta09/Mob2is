import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import BackButton from "../components/BackButton";

const C = {
  bg: "#F3F5F7",
  text: "#0B2D4D",
  muted: "rgba(11,45,77,0.62)",
  card: "#FFFFFF",
  stroke: "rgba(11,45,77,0.08)",
  blue: "#1579B3",
};

const PRIVACY_POLICY_URL =
  "https://ajuda.sapo.pt/pt-pt/security/politica-de-privacidade";
const COOKIE_POLICY_URL = "https://ajuda.sapo.pt/politica-de-cookies-9682";
const TERMS_PDF_SOURCE = Platform.select({
  android: { uri: "bundle-assets://legal/termos_e_condicoes.pdf" },
  default: require("../assets/legal/termos_e_condicoes.pdf"),
});

export default function TermsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  const openExternalLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        t("settings.link_error_title"),
        t("settings.link_error_message")
      );
    }
  };

  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topBar}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{t("more.items.terms.title")}</Text>
          <Text style={styles.subtitle}>
            {pages ? `${page}/${pages}` : t("more.items.terms.subtitle")}
          </Text>
        </View>

        <View style={styles.sidePlaceholder} />
      </View>

      <View style={styles.linksCard}>
        <Text style={styles.linksTitle}>{t("settings.terms_links_intro")}</Text>

        <View style={styles.linksRow}>
          <Pressable
            onPress={() => openExternalLink(PRIVACY_POLICY_URL)}
            style={styles.linkBtn}
          >
            <Text style={styles.linkBtnText}>{t("settings.privacy_policy")}</Text>
          </Pressable>

          <Pressable
            onPress={() => openExternalLink(COOKIE_POLICY_URL)}
            style={styles.linkBtn}
          >
            <Text style={styles.linkBtnText}>{t("settings.cookies_policy")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.pdfWrap}>
        <Pdf
          source={TERMS_PDF_SOURCE}
          style={styles.pdf}
          trustAllCerts={false}
          enablePaging={false}
          onLoadComplete={(numberOfPages) => {
            setPages(numberOfPages);
          }}
          onPageChanged={(nextPage) => {
            setPage(nextPage);
          }}
          onError={() => {
            Alert.alert(
              t("terms.pdf_error_title"),
              t("terms.pdf_error_message")
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: C.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: C.muted,
    textAlign: "center",
  },
  sidePlaceholder: {
    width: 40,
  },
  linksCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: C.stroke,
    marginBottom: 12,
  },
  linksTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: C.muted,
    marginBottom: 10,
  },
  linksRow: {
    flexDirection: "row",
    gap: 10,
  },
  linkBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "rgba(21,121,179,0.08)",
    borderWidth: 1,
    borderColor: "rgba(21,121,179,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  linkBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: C.blue,
    textAlign: "center",
  },
  pdfWrap: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.stroke,
    backgroundColor: "#FFFFFF",
  },
  pdf: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
});
