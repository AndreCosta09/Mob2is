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
          subtitle: "Configurações e informação",
          items: {
            route: {
              title: "Programar percurso",
              subtitle: "Criar rotas e preferências",
            },
            settings: {
              title: "Definições",
              subtitle: "Acessibilidade e idioma",
            },
            terms: {
              title: "Termos e condições",
              subtitle: "Privacidade e utilização",
            },
          },
        },

        onboarding: {
          titleLine1: "Qual é a sua",
          titleStrong: "condição?",
          button: "Iniciar",
          conditions: {
            visual: "DEFICIÊNCIA VISUAL",
            wheelchair: "CADEIRA DE RODAS",
            hearing: "DEFICIÊNCIA AUDITIVA",
            asd: "ESPECTRO DE AUTISMO (PEA)",
            stroller: "GRÁVIDAS, CRIANÇAS E CARRINHOS",
            elder: "IDOSO COM MOBILIDADE CONDICIONADA",
          },
        },

        locationBlocked: {
          badge: "Localização necessária",
          title: "A localização está desligada",
          description:
            "Pode continuar a explorar a app, mas para calcular rotas terá de permitir o acesso à localização.",
          helper:
            "Pode voltar a tentar agora, abrir as definições do dispositivo ou continuar sem localização.",
          open_settings: "Abrir definições",
          retry: "Tentar novamente",
          continue_without_location: "Continuar sem localização",
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
          terms_title: "Termos e condições",
          terms_intro:
            "Ao utilizar a Mob2is, aceita os Termos e Condições aplicáveis à utilização da aplicação e dos seus serviços.",
          terms_links_intro: "Consulte também os documentos legais associados:",
          privacy_policy: "Política de privacidade",
          cookies_policy: "Política de cookies",
          link_error_title: "Não foi possível abrir o link",
          link_error_message: "Tente novamente dentro de instantes.",
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
          public_services: "Serviços públicos",
          tourism: "Turismo",
          other: "Outros",
          title: "Categorias",
        },

        exploreSearch: {
          where_to: "Onde deseja ir?",
          listening_title: "A ouvir...",
          listening_hint: "Diz o destino, por exemplo: Hospital de Santa Luzia",
          placeholder: "Praça da...",
        },

        navigation: {
          destination: "Destino",
          eta: "Tempo estimado: {{min}} min",
          eta_unknown: "Tempo estimado: - min",
          eta_value: "Tempo estimado: {{value}}",
          following_hint: "A navegar e a seguir a tua localização",
          route_via_default: "Via R. de S. Vicente, Av. Cap. Gaspar de Castro",
          traffic_default: "Melhor rota, trânsito habitual",
          profile_fast: "Rápida",
          profile_balanced: "Equilibrada",
          profile_accessible: "Acessível",
          avg_slope_route: "Declive médio da rota",
          route_with_stairs: "Percurso com escadas",
          moderate_slope: "Inclinação moderada",
          uneven_relief: "Relevo irregular",
          reduced_slope: "Inclinação reduzida",
          reduced_relief: "Relevo reduzido",
          low_accessibility_slope: "Inclinação de baixa acessibilidade",
          low_accessibility_relief: "Relevo com baixa acessibilidade",
          hide: "Ocultar",
          start_route: "Iniciar rota",
          navigating: "Em navegação",
          new_route: "Nova rota",
          legend_high: "Alta acessibilidade",
          legend_medium: "Média acessibilidade",
          legend_low: "Baixa acessibilidade",
        },

        poiDetails: {
          fallback_title: "Ponto de interesse",
          fallback_subtitle: "VIANA DO CASTELO, PORTUGAL",
          fallback_eta: "Tempo estimado: 6 min",
          fallback_description:
            "Seleciona este destino para veres as opções de rota disponíveis.",
          select_route: "Selecionar rota",
          section_transport: "TRANSPORTES",
          section_commerce: "COMÉRCIO",
          departure_at: "Partida às {{time}}",
          trip_row: "Partida às {{depart}} -> Chegada às {{arrive}}",
        },

        map: {
          filters_title: "Filtros",
          filter_sheet_title: "Filtrar por categorias",
          summary_selected: "{{selected}} selecionada(s) • {{visible}} visíveis",
          summary_pois_visible: "{{count}} pontos de interesse visíveis",
          summary_points_visible: "{{count}} ponto(s) visível(eis)",
          missing_map_key: "A chave do mapa não está configurada para este build.",
          custom_destination_title: "Destino selecionado no mapa",
          custom_destination_description:
            "Ponto selecionado manualmente no mapa ({{lat}}, {{lng}}).",
          custom_destination_notice:
            "Tenha em consideração que as classificações de acessibilidade podem não estar disponíveis para o ponto selecionado.",
          custom_route_summary: "Destino personalizado",
          custom_traffic_summary: "Selecionado no mapa",
          show_street_accessibility: "Mostrar acessibilidade das ruas",
          street_network_nearby: "Rede pedestre perto da tua posição atual",
          route_loading_title: "A calcular a rota",
          route_loading_default: "A calcular a melhor rota para si",
          route_details: "Detalhes da rota",
        },

        search: {
          categories_title: "Categorias",
          go_to_place: "Ir até ao local",
          navigate_inside: "Navegar pelo interior",
          guided_visits: "Visitas guiadas: {{count}}",
          guided_visits_booking: "Visitas guiadas por marcação",
        },

        routePlanner: {
          title: "Programar percurso",
          current_condition: "Condição atual",
          change_condition: "Alterar condição",
          route_preference: "Preferência de rota",
          selected_route_label: "Rota pré-selecionada",
          selected_route_description:
            "Ao calcular a rota, esta opção fica escolhida por defeito.",
          confirm_condition_title: "Deseja alterar a sua condição?",
          confirm_condition_message:
            "Esta condição passará a ser usada por defeito nos próximos cálculos de rota.",
          change_condition_redirect:
            "Vai ser reencaminhado para o ecrã inicial para escolher uma nova condição.",
          confirm_condition_cancel: "Cancelar",
          confirm_condition_confirm: "Alterar",
          preferences: {
            rapida: {
              label: "Rápida",
              subtitle: "Menor tempo estimado",
            },
            equilibrada: {
              label: "Equilibrada",
              subtitle: "Melhor equilíbrio geral",
            },
            acessivel: {
              label: "Acessível",
              subtitle: "Maior foco na acessibilidade",
            },
          },
        },

        api: {
          server_error: "Ocorreu um erro ao comunicar com o servidor.",
          cannot_load_pois: "Não foi possível carregar os pontos de interesse.",
          cannot_search_destinations: "Não foi possível pesquisar os destinos.",
          cannot_load_destinations: "Não foi possível carregar os destinos.",
          cannot_load_categories: "Não foi possível carregar as categorias.",
          cannot_load_category_places:
            "Não foi possível carregar os locais desta categoria.",
          cannot_load_street_accessibility:
            "Não foi possível carregar a acessibilidade das ruas.",
          cannot_calculate_route: "Não foi possível calcular a rota.",
          cannot_recalculate_route: "Não foi possível recalcular a rota.",
          unnamed_poi: "Sem nome",
          uncategorized: "Outros",
          no_description: "Sem descrição disponível.",
        },

        routeFlow: {
          permission_required_title: "Permissão de localização necessária",
          permission_required_message:
            "Para calcular a rota, permita o acesso à localização nas definições do dispositivo.",
          open_settings: "Abrir definições",
          enable_location_title: "Ative a localização",
          enable_location_message:
            "Antes de calcular a rota, ative a localização do dispositivo e volte a tentar.",
          checking_location: "A verificar a sua localização",
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
          eta_value: "Estimated time: {{value}}",
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
          custom_destination_notice:
            "Please note that accessibility ratings may not be available for the selected point.",
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
          change_condition_redirect:
            "You will be redirected to the initial screen to choose a new condition.",
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
