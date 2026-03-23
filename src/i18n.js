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
          ok: "OK",
          loading: "A carregar...",
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
          subtitle: "Configuracoes e informacao",
          items: {
            route: {
              title: "Programar percurso",
              subtitle: "Criar rotas e preferencias",
            },
            settings: {
              title: "Definicoes",
              subtitle: "Acessibilidade e idioma",
            },
            terms: {
              title: "Termos e condicoes",
              subtitle: "Privacidade e utilizacao",
            },
          },
        },

        onboarding: {
          titleLine1: "Qual e a sua",
          titleStrong: "condicao?",
          button: "Iniciar",
          conditions: {
            visual: "DEFICIENCIA VISUAL",
            wheelchair: "CADEIRA DE RODAS",
            hearing: "DEFICIENCIA AUDITIVA",
            asd: "ESPECTRO DE AUTISMO (PEA)",
            stroller: "GRAVIDAS, CRIANCAS E CARRINHOS",
            elder: "IDOSO COM MOBILIDADE CONDICIONADA",
          },
        },

        locationBlocked: {
          badge: "Localizacao necessaria",
          title: "A localizacao esta desligada",
          description:
            "Pode continuar a explorar a app, mas para calcular rotas tera de permitir o acesso a localizacao.",
          helper:
            "Pode voltar a tentar agora, abrir as definicoes do dispositivo ou continuar sem localizacao.",
          open_settings: "Abrir definicoes",
          retry: "Tentar novamente",
          continue_without_location: "Continuar sem localizacao",
        },

        settings: {
          title: "Definicoes",
          section: {
            language: "Idioma",
            general: "Geral",
            accessibility: "Acessibilidade",
            legal: "Legal",
          },
          language: "Idioma da aplicacao",
          language_sub: "Escolhe o idioma dos menus e textos",
          notifications: "Notificacoes",
          notifications_sub: "Ativar alertas e avisos da app",
          location: "Localizacao",
          location_sub: "Usar GPS para melhorar resultados e navegacao",
          reduce_motion: "Reduzir animacoes",
          reduce_motion_sub: "Animacoes mais suaves e simples",
          high_contrast: "Alto contraste",
          high_contrast_sub: "Melhor legibilidade",
          terms_title: "Termos e condicoes",
          terms_intro:
            "Ao utilizar a Mob2is, aceita os Termos e Condicoes aplicaveis a utilizacao da aplicacao e dos seus servicos.",
          terms_links_intro: "Consulte tambem os documentos legais associados:",
          privacy_policy: "Politica de privacidade",
          cookies_policy: "Politica de cookies",
          link_error_title: "Nao foi possivel abrir o link",
          link_error_message: "Tente novamente dentro de instantes.",
        },

        terms: {
          pdf_error_title: "Nao foi possivel abrir o PDF",
          pdf_error_message:
            "Verifique se o documento foi incluido corretamente na app e tente novamente.",
        },

        categories: {
          culture: "Cultura",
          health: "Saude",
          transport: "Transportes",
          public_services: "Servicos publicos",
          tourism: "Turismo",
          other: "Outros",
          title: "Categorias",
        },

        exploreSearch: {
          where_to: "Onde deseja ir?",
          listening_title: "A ouvir...",
          listening_hint: "Diz o destino, por exemplo: Hospital de Santa Luzia",
          placeholder: "Praca da...",
        },

        navigation: {
          destination: "Destino",
          eta: "Tempo estimado: {{min}} min",
          eta_unknown: "Tempo estimado: - min",
          following_hint: "A navegar e a seguir a tua localizacao",
          route_via_default: "Via R. de S. Vicente, Av. Cap. Gaspar de Castro",
          traffic_default: "Melhor rota, transito habitual",
          profile_fast: "Rapida",
          profile_balanced: "Equilibrada",
          profile_accessible: "Acessivel",
          avg_slope_route: "Declive medio da rota",
          route_with_stairs: "Percurso com escadas",
          moderate_slope: "Inclinacao moderada",
          uneven_relief: "Relevo irregular",
          reduced_slope: "Inclinacao reduzida",
          reduced_relief: "Relevo reduzido",
          low_accessibility_slope: "Inclinacao de baixa acessibilidade",
          low_accessibility_relief: "Relevo com baixa acessibilidade",
          hide: "Ocultar",
          start_route: "Iniciar rota",
          navigating: "Em navegacao",
          new_route: "Nova rota",
          legend_high: "Alta acessibilidade",
          legend_medium: "Media acessibilidade",
          legend_low: "Baixa acessibilidade",
        },

        poiDetails: {
          fallback_title: "Ponto de interesse",
          fallback_subtitle: "VIANA DO CASTELO, PORTUGAL",
          fallback_eta: "Tempo estimado: 6 min",
          fallback_description:
            "Seleciona este destino para veres as opcoes de rota disponiveis.",
          select_route: "Selecionar rota",
          section_transport: "TRANSPORTES",
          section_commerce: "COMERCIO",
          departure_at: "Partida as {{time}}",
          trip_row: "Partida as {{depart}} -> Chegada as {{arrive}}",
        },

        map: {
          filters_title: "Filtros",
          filter_sheet_title: "Filtrar por categorias",
          summary_selected: "{{selected}} selecionada(s) • {{visible}} visiveis",
          summary_pois_visible: "{{count}} pontos de interesse visiveis",
          summary_points_visible: "{{count}} ponto(s) visivel(is)",
          missing_map_key: "A chave do mapa nao esta configurada para este build.",
          custom_destination_title: "Destino selecionado no mapa",
          custom_destination_description:
            "Ponto selecionado manualmente no mapa ({{lat}}, {{lng}}).",
          custom_route_summary: "Destino personalizado",
          custom_traffic_summary: "Selecionado no mapa",
          show_street_accessibility: "Mostrar acessibilidade das ruas",
          street_network_nearby: "Rede pedestre perto da tua posicao atual",
          route_loading_title: "A calcular a rota",
          route_loading_default: "A calcular a melhor rota para si",
          route_details: "Detalhes da rota",
        },

        search: {
          categories_title: "Categorias",
          go_to_place: "Ir ate ao local",
          navigate_inside: "Navegar pelo interior",
          guided_visits: "Visitas guiadas: {{count}}",
          guided_visits_booking: "Visitas guiadas por marcacao",
        },

        routePlanner: {
          title: "Programar percurso",
          current_condition: "Condicao atual",
          change_condition: "Alterar condicao",
          route_preference: "Preferencia de rota",
          selected_route_label: "Rota pre-selecionada",
          selected_route_description:
            "Ao calcular a rota, esta opcao fica escolhida por defeito.",
          confirm_condition_title: "Deseja alterar a sua condicao?",
          confirm_condition_message:
            "Esta condicao passara a ser usada por defeito nos proximos calculos de rota.",
          confirm_condition_cancel: "Cancelar",
          confirm_condition_confirm: "Alterar",
          preferences: {
            rapida: {
              label: "Rapida",
              subtitle: "Menor tempo estimado",
            },
            equilibrada: {
              label: "Equilibrada",
              subtitle: "Melhor equilibrio geral",
            },
            acessivel: {
              label: "Acessivel",
              subtitle: "Maior foco na acessibilidade",
            },
          },
        },

        api: {
          server_error: "Ocorreu um erro ao comunicar com o servidor.",
          cannot_load_pois: "Nao foi possivel carregar os pontos de interesse.",
          cannot_search_destinations: "Nao foi possivel pesquisar os destinos.",
          cannot_load_destinations: "Nao foi possivel carregar os destinos.",
          cannot_load_categories: "Nao foi possivel carregar as categorias.",
          cannot_load_category_places:
            "Nao foi possivel carregar os locais desta categoria.",
          cannot_load_street_accessibility:
            "Nao foi possivel carregar a acessibilidade das ruas.",
          cannot_calculate_route: "Nao foi possivel calcular a rota.",
          cannot_recalculate_route: "Nao foi possivel recalcular a rota.",
          unnamed_poi: "Sem nome",
          uncategorized: "Outros",
          no_description: "Sem descricao disponivel.",
        },

        routeFlow: {
          permission_required_title: "Permissao de localizacao necessaria",
          permission_required_message:
            "Para calcular a rota, permita o acesso a localizacao nas definicoes do dispositivo.",
          open_settings: "Abrir definicoes",
          enable_location_title: "Ative a localizacao",
          enable_location_message:
            "Antes de calcular a rota, ative a localizacao do dispositivo e volte a tentar.",
          checking_location: "A verificar a sua localizacao",
          calculating_route: "A calcular a melhor rota para si",
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
          ok: "OK",
          loading: "Loading...",
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
              title: "Plan route",
              subtitle: "Create routes and preferences",
            },
            settings: {
              title: "Settings",
              subtitle: "Accessibility and language",
            },
            terms: {
              title: "Terms and conditions",
              subtitle: "Privacy and usage",
            },
          },
        },

        onboarding: {
          titleLine1: "What is your",
          titleStrong: "condition?",
          button: "Start",
          conditions: {
            visual: "VISUAL IMPAIRMENT",
            wheelchair: "WHEELCHAIR",
            hearing: "HEARING IMPAIRMENT",
            asd: "AUTISM SPECTRUM (ASD)",
            stroller: "PREGNANT, CHILDREN AND STROLLERS",
            elder: "ELDERLY WITH LIMITED MOBILITY",
          },
        },

        locationBlocked: {
          badge: "Location needed",
          title: "Location is turned off",
          description:
            "You can keep exploring the app, but to calculate routes you will need to allow location access.",
          helper:
            "You can try again now, open the device settings, or continue without location.",
          open_settings: "Open settings",
          retry: "Try again",
          continue_without_location: "Continue without location",
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
          terms_title: "Terms and conditions",
          terms_intro:
            "By using Mob2is, you accept the Terms and Conditions that apply to the use of the app and its services.",
          terms_links_intro: "Please also review the related legal documents:",
          privacy_policy: "Privacy policy",
          cookies_policy: "Cookie policy",
          link_error_title: "Could not open the link",
          link_error_message: "Please try again in a moment.",
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
          public_services: "Public services",
          tourism: "Tourism",
          other: "Other",
          title: "Categories",
        },

        exploreSearch: {
          where_to: "Where do you want to go?",
          listening_title: "Listening...",
          listening_hint: "Say a destination, for example: Santa Luzia Hospital",
          placeholder: "Town square...",
        },

        navigation: {
          destination: "Destination",
          eta: "Estimated time: {{min}} min",
          eta_unknown: "Estimated time: - min",
          following_hint: "Navigating and following your location",
          route_via_default: "Via R. de S. Vicente, Av. Cap. Gaspar de Castro",
          traffic_default: "Best route, usual traffic",
          profile_fast: "Fast",
          profile_balanced: "Balanced",
          profile_accessible: "Accessible",
          avg_slope_route: "Average route slope",
          route_with_stairs: "Route with stairs",
          moderate_slope: "Moderate slope",
          uneven_relief: "Uneven terrain",
          reduced_slope: "Reduced slope",
          reduced_relief: "Reduced terrain variation",
          low_accessibility_slope: "Low-accessibility slope",
          low_accessibility_relief: "Terrain with low accessibility",
          hide: "Hide",
          start_route: "Start route",
          navigating: "Navigating",
          new_route: "New route",
          legend_high: "High accessibility",
          legend_medium: "Medium accessibility",
          legend_low: "Low accessibility",
        },

        poiDetails: {
          fallback_title: "Point of interest",
          fallback_subtitle: "VIANA DO CASTELO, PORTUGAL",
          fallback_eta: "Estimated time: 6 min",
          fallback_description:
            "Select this destination to see the available route options.",
          select_route: "Select route",
          section_transport: "TRANSPORT",
          section_commerce: "COMMERCE",
          departure_at: "Departure at {{time}}",
          trip_row: "Departure at {{depart}} -> Arrival at {{arrive}}",
        },

        map: {
          filters_title: "Filters",
          filter_sheet_title: "Filter by categories",
          summary_selected: "{{selected}} selected • {{visible}} visible",
          summary_pois_visible: "{{count}} points of interest visible",
          summary_points_visible: "{{count}} point(s) visible",
          missing_map_key: "The map key is not configured for this build.",
          custom_destination_title: "Destination selected on the map",
          custom_destination_description:
            "Point manually selected on the map ({{lat}}, {{lng}}).",
          custom_route_summary: "Custom destination",
          custom_traffic_summary: "Selected on the map",
          show_street_accessibility: "Show street accessibility",
          street_network_nearby: "Pedestrian network near your current location",
          route_loading_title: "Calculating route",
          route_loading_default: "Calculating the best route for you",
          route_details: "Route details",
        },

        search: {
          categories_title: "Categories",
          go_to_place: "Go to place",
          navigate_inside: "Navigate inside",
          guided_visits: "Guided visits: {{count}}",
          guided_visits_booking: "Guided visits by appointment",
        },

        routePlanner: {
          title: "Plan route",
          current_condition: "Current condition",
          change_condition: "Change condition",
          route_preference: "Route preference",
          selected_route_label: "Preselected route",
          selected_route_description:
            "When a route is calculated, this option is selected by default.",
          confirm_condition_title: "Do you want to change your condition?",
          confirm_condition_message:
            "This condition will be used by default in future route calculations.",
          confirm_condition_cancel: "Cancel",
          confirm_condition_confirm: "Change",
          preferences: {
            rapida: {
              label: "Fast",
              subtitle: "Shortest estimated time",
            },
            equilibrada: {
              label: "Balanced",
              subtitle: "Best overall balance",
            },
            acessivel: {
              label: "Accessible",
              subtitle: "Greater focus on accessibility",
            },
          },
        },

        api: {
          server_error: "There was an error communicating with the server.",
          cannot_load_pois: "Could not load the points of interest.",
          cannot_search_destinations: "Could not search destinations.",
          cannot_load_destinations: "Could not load destinations.",
          cannot_load_categories: "Could not load categories.",
          cannot_load_category_places: "Could not load the places in this category.",
          cannot_load_street_accessibility: "Could not load street accessibility.",
          cannot_calculate_route: "Could not calculate the route.",
          cannot_recalculate_route: "Could not recalculate the route.",
          unnamed_poi: "Unnamed place",
          uncategorized: "Other",
          no_description: "No description available.",
        },

        routeFlow: {
          permission_required_title: "Location permission required",
          permission_required_message:
            "To calculate the route, allow location access in the device settings.",
          open_settings: "Open settings",
          enable_location_title: "Turn on location",
          enable_location_message:
            "Before calculating the route, turn on device location and try again.",
          checking_location: "Checking your location",
          calculating_route: "Calculating the best route for you",
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
