import React from "react";
import { Pressable, StyleSheet } from "react-native";
import BackIcon from "../assets/back.svg";

export default function BackButton({
  onPress,
  accessibilityLabel = "Voltar",
  style,
  iconSize = 18,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <BackIcon width={iconSize} height={iconSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(11,45,77,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});
