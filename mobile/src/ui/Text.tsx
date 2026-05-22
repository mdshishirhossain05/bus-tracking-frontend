import React from "react";
import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { colors, fonts, fontSize } from "../theme/tokens";

type Variant = "display" | "title" | "subtitle" | "body" | "label" | "caption";

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  /** Tabular figures keep live numbers (ETA, speed) from shifting width. */
  tabular?: boolean;
  weight?: keyof typeof fonts;
}

const VARIANT_STYLE: Record<Variant, { fontSize: number; fontFamily: string }> =
  {
    display: { fontSize: fontSize.display, fontFamily: fonts.bold },
    title: { fontSize: fontSize.xl, fontFamily: fonts.semibold },
    subtitle: { fontSize: fontSize.lg, fontFamily: fonts.semibold },
    body: { fontSize: fontSize.md, fontFamily: fonts.regular },
    label: { fontSize: fontSize.sm, fontFamily: fonts.medium },
    caption: { fontSize: fontSize.xs, fontFamily: fonts.medium },
  };

export function Text({
  variant = "body",
  color = colors.foreground,
  tabular = false,
  weight,
  style,
  ...rest
}: AppTextProps) {
  const base = VARIANT_STYLE[variant];
  return (
    <RNText
      {...rest}
      style={[
        { fontFamily: base.fontFamily, fontSize: base.fontSize, color },
        weight ? { fontFamily: fonts[weight] } : null,
        tabular ? styles.tabular : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ["tabular-nums"] },
});
