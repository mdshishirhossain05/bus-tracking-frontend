import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/tokens";

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/** Single source for iconography — Ionicons, sized and colored from tokens. */
export function Icon({ name, size = 20, color = colors.foreground }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
