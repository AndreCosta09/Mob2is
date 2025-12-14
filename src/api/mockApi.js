export const VIANA_COORDS = [-8.8273, 41.6946];

export const CATEGORIES = [
  { id: "saude", name: "Saúde" },
  { id: "servicos", name: "Serviços Públicos" },
  { id: "transportes", name: "Transportes" },
  { id: "cultura", name: "Cultura" },
  { id: "turismo", name: "Turismo" },
  { id: "restaurantes", name: "Restaurantes" },
  { id: "museus", name: "Museus" },
];

export const POIS = [
  {
    id: 1,
    title: "Praça da República",
    categoryId: "turismo",
    rating: 4.7,
    coords: [-8.8279, 41.6936],
    description:
      "A principal praça de Viana do Castelo, rodeada de edifícios históricos e pontos de interesse.",
    visits: 158800,
  },
  {
    id: 2,
    title: "Casa dos Nichos",
    categoryId: "cultura",
    rating: 4.5,
    coords: [-8.8285, 41.6935],
    description:
      "Edifício do século XV recuperado, associado ao núcleo museológico de arte e arqueologia.",
    visits: 88050,
  },
  {
    id: 3,
    title: "Museu do Traje",
    categoryId: "museus",
    rating: 4.8,
    coords: [-8.8290, 41.6920],
    description:
      "Museu dedicado ao traje vianense e tradições da região.",
    visits: 102300,
  },
  {
    id: 4,
    title: "Hospital de Santa Luzia",
    categoryId: "saude",
    rating: 4.2,
    coords: [-8.8222, 41.7052],
    description: "Hospital e serviços de urgência/consulta.",
    visits: 0,
  },
  {
    id: 5,
    title: "Câmara Municipal",
    categoryId: "servicos",
    rating: 4.4,
    coords: [-8.8274, 41.6939],
    description: "Serviços municipais e atendimento ao público.",
    visits: 0,
  },
  {
    id: 6,
    title: "Estação de Comboios",
    categoryId: "transportes",
    rating: 4.3,
    coords: [-8.8344, 41.6948],
    description: "Estação ferroviária de Viana do Castelo.",
    visits: 0,
  },
];

export const fetchCategories = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(CATEGORIES), 200));
};

export const fetchPoisByCategory = async (categoryId) => {
  return new Promise((resolve) =>
    setTimeout(() => resolve(POIS.filter((p) => p.categoryId === categoryId)), 250)
  );
};

export const searchPois = async (q) => {
  const query = (q ?? "").trim().toLowerCase();
  const results = !query
    ? POIS
    : POIS.filter((p) => p.title.toLowerCase().includes(query));
  return new Promise((resolve) => setTimeout(() => resolve(results), 200));
};
