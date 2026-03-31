export const ACCESS_COLORS = {
  alta: "#39A25D",
  media: "#F0B429",
  baixa: "#FF4D6D",
  none: "#9AA3AD",
};

const LEVEL_ALTA = "Alta acessibilidade";
const LEVEL_MEDIA = "Média acessibilidade";
const LEVEL_BAIXA = "Baixa acessibilidade";
const LEVEL_NONE = "Sem dados";

export function levelFromApiValue(v) {
  const n = Number(v);
  if (n === 3) return LEVEL_ALTA;
  if (n === 2) return LEVEL_MEDIA;
  if (n === 1) return LEVEL_BAIXA;
  if (n === 0) return LEVEL_NONE;
  return LEVEL_ALTA;
}

export function paletteColorFromLevel(level) {
  if (level === LEVEL_NONE) return ACCESS_COLORS.none;
  if (level === LEVEL_BAIXA) return ACCESS_COLORS.baixa;
  if (level === LEVEL_MEDIA) return ACCESS_COLORS.media;
  return ACCESS_COLORS.alta;
}
