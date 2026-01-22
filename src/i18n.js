import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  lng: "pt",
  fallbackLng: "pt",
  interpolation: { escapeValue: false },
  resources: {
    pt: {
      translation: {
        settings: {
          title: "Definições",
          section: {
            language: "Idioma",
            general: "Geral",
            accessibility: "Acessibilidade",
          },
          language: "Idioma da aplicação",
          language_sub: "Escolhe o idioma dos menus e textos",
          notifications: "Notificações",
          notifications_sub: "Ativar alertas e avisos da app",
          location: "Localização",
          location_sub: "Usar GPS para melhorar resultados e navegação",
          reduce_motion: "Reduzir animações",
          reduce_motion_sub: "Animações mais suaves e simples",
          high_contrast: "Alto contraste",
          high_contrast_sub: "Melhor legibilidade",
        },
      },
    },
    en: {
      translation: {
        settings: {
          title: "Settings",
          section: {
            language: "Language",
            general: "General",
            accessibility: "Accessibility",
          },
          language: "App language",
          language_sub: "Choose the language used in the app",
          notifications: "Notifications",
          notifications_sub: "Enable alerts and app notifications",
          location: "Location",
          location_sub: "Use GPS to improve results and navigation",
          reduce_motion: "Reduce motion",
          reduce_motion_sub: "Simpler and smoother animations",
          high_contrast: "High contrast",
          high_contrast_sub: "Better readability",
        },
      },
    },
  },
});

export default i18n;
