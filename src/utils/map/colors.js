export const ACCESS_COLORS = {
  alta: "#FF4D6D",
  media: "#F0B429",
  baixa: "#39A25D",
};

export function hexToRgb(hex) {
  if (!hex) return null;
  const h = String(hex).trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

export function rgbToHsv({ r, g, b }) {
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const max = Math.max(rp, gp, bp);
  const min = Math.min(rp, gp, bp);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rp) h = ((gp - bp) / d) % 6;
    else if (max === gp) h = (bp - rp) / d + 2;
    else h = (rp - gp) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function rgbLuma({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function accessibilityLabelFromColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Alta acessibilidade";
  const { h, s } = rgbToHsv(rgb);

  if (s > 0.18) {
    if (h < 15 || h >= 330) return "Baixa acessibilidade";
    if (h >= 15 && h < 75) return "Média acessibilidade";
  }
  return "Alta acessibilidade";
}

export function levelFromApiColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Alta acessibilidade";

  const { h } = rgbToHsv(rgb);
  const l = rgbLuma(rgb);

  if (h >= 80 && h <= 170) return "Alta acessibilidade";
  if (h >= 170 && h <= 260) {
    return l < 0.42 ? "Baixa acessibilidade" : "Média acessibilidade";
  }

  return accessibilityLabelFromColor(hex);
}

export function paletteColorFromLevel(level) {
  if (level === "Baixa acessibilidade") return ACCESS_COLORS.baixa;
  if (level === "Média acessibilidade") return ACCESS_COLORS.media;
  return ACCESS_COLORS.alta;
}
