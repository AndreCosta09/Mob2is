import AutismIcon from "../assets/condicao/autismo.svg";
import HearingIcon from "../assets/condicao/auditiva.svg";
import WheelchairIcon from "../assets/condicao/cadeira_rodas.svg";
import StrollerIcon from "../assets/condicao/gravidas.svg";
import ElderIcon from "../assets/condicao/idoso.svg";
import VisualIcon from "../assets/condicao/visual.svg";

export const CONDITIONS = [
  {
    key: "visual",
    label: "DEFICIENCIA VISUAL",
    color: "#FF6B57",
    Icon: VisualIcon,
  },
  {
    key: "wheelchair",
    label: "CADEIRA DE RODAS",
    color: "#8BC34A",
    Icon: WheelchairIcon,
  },
  {
    key: "hearing",
    label: "DEFICIENCIA AUDITIVA",
    color: "#9C7CF4",
    Icon: HearingIcon,
  },
  {
    key: "asd",
    label: "ESPECTRO DE AUTISMO (PEA)",
    color: "#FFD166",
    Icon: AutismIcon,
  },
  {
    key: "stroller",
    label: "GRAVIDAS, CRIANCAS E CARRINHOS",
    color: "#FF4D6D",
    Icon: StrollerIcon,
  },
  {
    key: "elder",
    label: "IDOSO COM MOBILIDADE CONDICIONADA",
    color: "#4FC3F7",
    Icon: ElderIcon,
  },
];

export const ROUTE_PREFERENCES = [
  {
    key: "rapida",
    label: "Rapida",
    subtitle: "Menor tempo estimado",
  },
  {
    key: "equilibrada",
    label: "Equilibrada",
    subtitle: "Melhor equilibrio geral",
  },
  {
    key: "acessivel",
    label: "Acessivel",
    subtitle: "Maior foco na acessibilidade",
  },
];

export function getConditionOption(conditionKey) {
  return CONDITIONS.find((item) => item.key === conditionKey) ?? CONDITIONS[0];
}

export function normalizeRoutePreference(value) {
  const valid = ROUTE_PREFERENCES.some((item) => item.key === value);
  return valid ? value : "equilibrada";
}
