export const VIANA_COORDS = [ -8.8273, 41.6946 ]; 

export const fetchPointsOfInterest = async (category) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          title: "Casa dos Nichos",
          category: "Cultura",
          rating: 4.5,
          coords: [-8.8285, 41.6935],
          description: "Edifício do século XV recuperado...",
        },
        {
          id: 2,
          title: "Museu do Traje",
          category: "Cultura",
          rating: 4.8,
          coords: [-8.8290, 41.6920],
          description: "Museu dedicado ao traje vianense.",
        }
      ]);
    }, 500);
  });
};