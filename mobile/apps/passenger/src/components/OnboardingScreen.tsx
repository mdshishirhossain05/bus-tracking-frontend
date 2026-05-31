import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Text,
  Icon,
  colors,
  spacing,
  radius,
  type IconName,
} from "@ubts/shared";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Slide = {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: "navigate-circle",
    iconBg: "rgba(99, 102, 241, 0.18)",
    iconColor: "#a5b4fc",
    title: "Real-time bus tracking",
    body: "See your bus moving on the map, second by second. No more guessing whether it's coming or already passed.",
  },
  {
    icon: "notifications",
    iconBg: "rgba(34, 197, 94, 0.16)",
    iconColor: colors.success,
    title: "Smart alerts",
    body: "Get a heads-up when your bus is a few minutes from your stop — even when the app is closed.",
  },
  {
    icon: "time",
    iconBg: "rgba(59, 130, 246, 0.16)",
    iconColor: "#60a5fa",
    title: "Pre-trip visibility",
    body: "Know whether the bus is still parked, on the way to the start, or already boarding — long before it leaves the depot.",
  },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (next !== index) {
        setIndex(next);
        void Haptics.selectionAsync();
      }
    },
    [index],
  );

  const isLast = index === SLIDES.length - 1;

  const next = useCallback(() => {
    if (isLast) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDone();
    } else {
      scrollRef.current?.scrollTo({
        x: SCREEN_WIDTH * (index + 1),
        animated: true,
      });
    }
  }, [index, isLast, onDone]);

  const skip = useCallback(() => {
    void Haptics.selectionAsync();
    onDone();
  }, [onDone]);

  const dots = useMemo(
    () =>
      SLIDES.map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === index ? styles.dotActive : styles.dotInactive,
          ]}
        />
      )),
    [index],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.skipRow}>
        {!isLast ? (
          <Pressable onPress={skip} hitSlop={12}>
            <Text variant="label" color={colors.mutedForeground}>
              Skip
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.scroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View
              style={[styles.iconWrap, { backgroundColor: slide.iconBg }]}
            >
              <Icon name={slide.icon} size={56} color={slide.iconColor} />
            </View>
            <Text
              variant="title"
              color={colors.foreground}
              style={styles.title}
            >
              {slide.title}
            </Text>
            <Text
              variant="body"
              color={colors.mutedForeground}
              style={styles.body}
            >
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>{dots}</View>
        <Pressable
          onPress={next}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
          ]}
        >
          <Text variant="subtitle" color={colors.primaryForeground}>
            {isLast ? "Get started" : "Next"}
          </Text>
          <Icon
            name={isLast ? "checkmark" : "arrow-forward"}
            size={20}
            color={colors.primaryForeground}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    height: 32,
  },
  scroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { textAlign: "center" },
  body: { textAlign: "center", maxWidth: 320, lineHeight: 22 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: colors.primary },
  dotInactive: { width: 6, backgroundColor: colors.muted },
  cta: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPressed: { opacity: 0.85 },
});
