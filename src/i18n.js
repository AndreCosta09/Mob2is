import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  lng: "pt", 
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  resources: {
    pt: {
      translation: {
        common: {
            cancel: "Cancelar",
            clear: "Limpar",
            done: "Concluir",
            loading: "A carregar…",
            km: "km",
            city_viana: "VIANA DO CASTELO, PORTUGAL",
          },

        tabs: {
          explore: "Explorar",
          search: "Categorias",
          more: "Mais",
        },

        more: {
          title: "Mais",
          subtitle: "Configurações e informação",
          items: {
            route: {
              title: "Programar Percurso",
              subtitle: "Criar rotas e preferências",
            },
            settings: {
              title: "Definições",
              subtitle: "Acessibilidade e idioma",
            },
            terms: {
              title: "Termos e Condições",
              subtitle: "Privacidade e utilização",
            },
          },
        },

        onboarding: {
          titleLine1: "Qual é a sua",
          titleStrong: "condição?",
          button: "Iniciar Rota",
          conditions: {
            visual: "DEFICIÊNCIA VISUAL",
            wheelchair: "CADEIRA DE RODAS",
            hearing: "DEFICIÊNCIA AUDITIVA",
            asd: "ESPECTRO DE AUTISMO (PEA)",
            stroller: "GRÁVIDAS, CRIANÇAS E CARRINHOS",
            elder: "IDOSO COM MOBILIDADE CONDICIONADA",
          },
        },

        settings: {
          title: "Definições",
          section: {
            language: "Idioma",
            general: "Geral",
            accessibility: "Acessibilidade",
            legal: "Legal",
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
          terms_title: "Termos e Condições",
          terms_intro:
            "Ao utilizar a Mob2is, aceita os Termos e Condições aplicáveis à utilização da aplicação e dos seus serviços.",
          terms_links_intro:
            "Consulte também os documentos legais associados:",
          privacy_policy: "Política de Privacidade",
          cookies_policy: "Política de Cookies",
          link_error_title: "Não foi possível abrir o link",
          link_error_message:
            "Tente novamente dentro de instantes.",
        },
        terms: {
          pdf_error_title: "Não foi possível abrir o PDF",
          pdf_error_message:
            "Verifique se o documento foi incluído corretamente na app e tente novamente.",
        },

        categories: {
          culture: "Cultura",
          health: "Saúde",
          transport: "Transportes",
          public_services: "Serviços Públicos",
          tourism: "Turismo",
          other: "Outros",
          title: "Categorias",
        },
        exploreSearch: {
          where_to: "Onde deseja ir?",
          listening_title: "A ouvir…",
          listening_hint: "Diz o destino, por exemplo: “Hospital de Santa Luzia”",
          placeholder: "Praça da...",
        },

        navigation: {
          destination: "Destino",
          eta: "⏱ Tempo estimado: {{min}} min",
          eta_unknown: "⏱ Tempo estimado: - min",
          following_hint: "A navegar • a seguir a tua localização",

          hide: "Ocultar",
          start_route: "Iniciar rota",
          navigating: "Em navegação",
          new_route: "Nova rota",

          legend_high: "Alta acessibilidade",
          legend_medium: "Média acessibilidade",
          legend_low: "Baixa acessibilidade",
        },

        poiDetails: {
          fallback_title: "Ponto de Interesse",
          fallback_subtitle: "VIANA DO CASTELO, PORTUGAL",

          section_transport: "TRANSPORTES",
          section_commerce: "COMÉRCIO",

          departure_at: "Partida às {{time}}",
          trip_row: "Partida às {{depart}}  →  Chegada às {{arrive}}",
        },

        map: {
            filters_title: "Filtros",
            filter_sheet_title: "Filtrar por categorias",
            summary_selected: "{{selected}} selecionada(s) • {{visible}} visíveis",
            summary_pois_visible: "{{count}} Pontos de Interesse visíveis",
            summary_points_visible: "{{count}} Ponto(s) visível(is)",

            route_details: "Detalhes da rota",
          },

        search: {
            categories_title: "Categorias",
            go_to_place: "Ir até ao local",
            navigate_inside: "Navegar pelo interior",
            guided_visits: "Visitas guiadas: {{count}}",
            guided_visits_booking: "Visitas guiadas por marcação",

          },

        a11y: {
          map_center_user: "Centrar no utilizador",
          map_open_filters: "Abrir filtros de categorias",
          map_open_route_details: "Abrir detalhes da rota",

          nav_hide_details: "Ocultar detalhes",
          nav_start_route: "Iniciar rota",
          nav_new_route: "Nova rota",

          voice_search: "Pesquisa por voz",
        },
      },
    },

    en: {
      translation: {
        common: {
            cancel: "Cancel",
            clear: "Clear",
            done: "Done",
            loading: "Loading…",
            km: "km",
            city_viana: "VIANA DO CASTELO, PORTUGAL",
        },

        tabs: {
          explore: "Explore",
          search: "Categories",
          more: "More",
        },

        more: {
          title: "More",
          subtitle: "Settings and information",
          items: {
            route: {
              title: "Plan Route",
              subtitle: "Create routes and preferences",
            },
            settings: {
              title: "Settings",
              subtitle: "Accessibility and language",
            },
            terms: {
              title: "Terms & Conditions",
              subtitle: "Privacy and usage",
            },
          },
        },

        onboarding: {
          titleLine1: "What is your",
          titleStrong: "condition?",
          button: "Start Route",
          conditions: {
            visual: "VISUAL IMPAIRMENT",
            wheelchair: "WHEELCHAIR",
            hearing: "HEARING IMPAIRMENT",
            asd: "AUTISM SPECTRUM (ASD)",
            stroller: "PREGNANT, CHILDREN & STROLLERS",
            elder: "ELDERLY WITH LIMITED MOBILITY",
          },
        },

        settings: {
          title: "Settings",
          section: {
            language: "Language",
            general: "General",
            accessibility: "Accessibility",
            legal: "Legal",
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
          terms_title: "Terms & Conditions",
          terms_intro:
            "By using Mob2is, you accept the Terms & Conditions that apply to the use of the app and its services.",
          terms_links_intro:
            "Please also review the related legal documents:",
          privacy_policy: "Privacy Policy",
          cookies_policy: "Cookie Policy",
          link_error_title: "Could not open the link",
          link_error_message:
            "Please try again in a moment.",
        },
        terms: {
          pdf_error_title: "Could not open the PDF",
          pdf_error_message:
            "Please verify that the document is bundled correctly in the app and try again.",
        },

        categories: {
          culture: "Culture",
          health: "Health",
          transport: "Transport",
          public_services: "Public Services",
          tourism: "Tourism",
          other: "Other",
          title: "Categories",
        },

        exploreSearch: {
            where_to: "Where do you want to go?",
            listening_title: "Listening…",
            listening_hint: "Say a destination, e.g. “Santa Luzia Hospital”",
            placeholder: "Praça da...",
          },

        navigation: {
            destination: "Destination",
            eta: "⏱ Estimated time: {{min}} min",
            eta_unknown: "⏱ Estimated time: - min",
            following_hint: "Navigating • following your location",

            hide: "Hide",
            start_route: "Start route",
            navigating: "Navigating",
            new_route: "New route",

            legend_high: "High accessibility",
            legend_medium: "Medium accessibility",
            legend_low: "Low accessibility",
          },

        poiDetails: {
            fallback_title: "Point of Interest",
            fallback_subtitle: "VIANA DO CASTELO, PORTUGAL",

            section_transport: "TRANSPORT",
            section_commerce: "COMMERCE",

            departure_at: "Departure at {{time}}",
            trip_row: "Departure at {{depart}}  →  Arrival at {{arrive}}",
          },

        map: {
            filters_title: "Filters",
            filter_sheet_title: "Filter by categories",

            summary_selected: "{{selected}} selected • {{visible}} visible",
            summary_pois_visible: "{{count}} Points of Interest visible",
            summary_points_visible: "{{count}} point(s) visible",

            route_details: "Route details",
          },

        search: {
            categories_title: "Categories",
            go_to_place: "Go to place",
            navigate_inside: "Navigate inside",
            guided_visits: "Guided visits: {{count}}",
            guided_visits_booking: "Guided visits by appointment",

          },

        a11y: {
          map_center_user: "Center on user",
          map_open_filters: "Open category filters",
          map_open_route_details: "Open route details",

          nav_hide_details: "Hide details",
          nav_start_route: "Start route",
          nav_new_route: "New route",

          voice_search: "Voice search",
        },



      },
    },
  },
});

export default i18n;
