import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useT } from "@ubts/shared";
import { colors, fonts, radius, spacing } from "@ubts/shared";
import { useAuth } from "@ubts/shared";

interface LoginScreenProps {
  onGoToRegister?: () => void;
  onGoToForgotPassword?: () => void;
}

export function LoginScreen({
  onGoToRegister,
  onGoToForgotPassword,
}: LoginScreenProps = {}) {
  const t = useT();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError(t("auth.login.missing"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t("auth.login.invalid"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="title" color={colors.foreground}>
              {t("auth.login.title")}
            </Text>
            <Text variant="body" color={colors.mutedForeground}>
              {t("auth.login.subtitle")}
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label={t("auth.field.email")}
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.field.emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label={t("auth.field.password")}
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.field.passwordPlaceholder")}
              secureTextEntry
            />

            {error && (
              <Text variant="caption" color={colors.danger}>
                {error}
              </Text>
            )}

            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("auth.login.signIn")}
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text variant="label" color={colors.primaryForeground}>
                  {t("auth.login.signIn")}
                </Text>
              )}
            </Pressable>

            {onGoToForgotPassword ? (
              <Pressable
                onPress={onGoToForgotPassword}
                hitSlop={8}
                style={styles.forgotRow}
              >
                <Text variant="caption" color={colors.primary}>
                  {t("auth.login.forgotPassword")}
                </Text>
              </Pressable>
            ) : null}

            {onGoToRegister ? (
              <View style={styles.signupRow}>
                <Text variant="caption" color={colors.mutedForeground}>
                  {t("auth.login.noAccount")}
                </Text>
                <Pressable onPress={onGoToRegister} hitSlop={8}>
                  <Text variant="caption" color={colors.primary}>
                    {t("auth.login.createOne")}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text variant="caption" color={colors.mutedForeground}>
        {label}
      </Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.faintForeground}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  header: { gap: spacing.xs },
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  input: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  buttonPressed: { backgroundColor: colors.primaryActive },
  buttonDisabled: { opacity: 0.7 },
  forgotRow: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
