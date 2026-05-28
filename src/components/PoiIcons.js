
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";

const ICON_COLOR = "#051F41";

function IconDefault({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx="12" cy="11" r="2.5" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
function IconHealth({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" fill={color} />
    </Svg>
  );
}
function IconCulture({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 10h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M6 10v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M10 10v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 10v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M18 10v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3.5 10 12 5l8.5 5" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M4 19h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
function IconEducation({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 6h7a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H5V6Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M19 6h-7a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h7V6Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M8 10h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
function IconTransport({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M7 8h10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="8" cy="18" r="1.7" stroke={color} strokeWidth={2} />
      <Circle cx="16" cy="18" r="1.7" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
function IconFood({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 3v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5 3v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 3v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M7 11v10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M15 3v8c0 1.5 1 2.5 2.5 2.5V21" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 8h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
function IconSport({ size = 18, color = ICON_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="9" width="3" height="6" rx="1" stroke={color} strokeWidth={2} />
      <Rect x="18" y="9" width="3" height="6" rx="1" stroke={color} strokeWidth={2} />
      <Path d="M6 12h12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x="8" y="10" width="8" height="4" rx="1" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

const POI_SVG = {
  default: IconDefault,
  health: IconHealth,
  culture: IconCulture,
  education: IconEducation,
  transport: IconTransport,
  food: IconFood,
  sport: IconSport,
};

function PoiSvgIcon({ name, size = 18, color }) {
  const Comp = POI_SVG[name] ?? IconDefault;
  return <Comp size={size} color={color} />;
}

function IconCenter({ size = 22, color = "#051F41", accent = "#F09C1F" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="2.5" fill={accent} />
      <Path d="M12 2v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 19v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M2 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}


function IconFilters({ size = 22, color = "#051F41", accent = "#F09C1F" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth={2.2} strokeLinecap="round" />

      <Circle cx="9" cy="7" r="2.2" fill="#FFFFFF" stroke={color} strokeWidth={2} />
      <Circle cx="15" cy="12" r="2.2" fill="#FFFFFF" stroke={accent} strokeWidth={2} />
      <Circle cx="11" cy="17" r="2.2" fill="#FFFFFF" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function IconClose({ size = 18, color = "#051F41" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 6.5 17.5 17.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M17.5 6.5 6.5 17.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}



export { PoiSvgIcon, IconCenter, IconFilters, IconClose };
