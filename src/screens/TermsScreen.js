import React, { useState } from "react";
import {
  Alert,
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

const LEGAL_DOCS = {
  terms: {
    titleKey: "settings.terms_title",
    source: Platform.select({
      android: { uri: "bundle-assets://legal/termos_e_condicoes.pdf" },
      default: require("../assets/legal/termos_e_condicoes.pdf"),
    }),
  },
  privacy: {
    titleKey: "settings.privacy_policy",
    source: Platform.select({
      android: { uri: "bundle-assets://legal/Politica_de_Privacidade.pdf" },
      default: require("../assets/legal/Politica_de_Privacidade.pdf"),
    }),
  },
  cookies: {
    titleKey: "settings.cookies_policy",
    source: Platform.select({
      android: { uri: "bundle-assets://legal/Politica_de_Cookies.pdf" },
      default: require("../assets/legal/Politica_de_Cookies.pdf"),
    }),
  },
};

const LEGAL_DOC_ORDER = ["terms", "privacy", "cookies"];

export default function TermsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [currentDocKey, setCurrentDocKey] = useState("terms");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const currentDoc = LEGAL_DOCS[currentDocKey] ?? LEGAL_DOCS.terms;
  const actionDocKeys = LEGAL_DOC_ORDER.filter((key) => key !== currentDocKey);

  const switchDocument = (nextDocKey) => {
    setCurrentDocKey(nextDocKey);
    setPage(1);
    setPages(0);
  };

  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topBar}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{t(currentDoc.titleKey)}</Text>
          <Text style={styles.subtitle}>
            {pages ? `${page}/${pages}` : t("more.items.terms.subtitle")}
          </Text>
        </View>

        <View style={styles.sidePlaceholder} />
      </View>

      <View style={styles.linksCard}>
        <Text style={styles.linksTitle}>{t("settings.terms_links_intro")}</Text>

        <View style={styles.linksRow}>
          {actionDocKeys.map((docKey) => (
            <Pressable
              key={docKey}
              onPress={() => switchDocument(docKey)}
              style={styles.linkBtn}
            >
              <Text style={styles.linkBtnText}>{t(LEGAL_DOCS[docKey].titleKey)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.pdfWrap}>
        <Pdf
          key={currentDocKey}
          source={currentDoc.source}
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
