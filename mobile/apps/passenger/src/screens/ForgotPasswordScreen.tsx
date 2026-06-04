import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Icon,
  StatusBadge,
  colors,
  fonts,
  radius,
  spacing,
  forgotPasswordRequest,
  forgotPasswordVerify,
  resetPassword,
  useT,
  type StringKey,
} from "@ubts/shared";
import { PasswordField } from "../components/PasswordField";

type Step = 1 | 2 | 3;

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordScreen({
  onBackToLogin,
}: ForgotPasswordScreenProps) {
  const t = useT();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationToken, setVerificationToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  const passwordRules = useMemo(() => evaluatePassword(password), [password]);
  const passwordOk = passwordRules.every((r) => r.met);

  const sendOtp = useCallback(async () => {
    if (!email.trim()) {
      setError(t("auth.forgot.enterEmail"));
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await forgotPasswordRequest(email.trim().toLowerCase());
      setOtpSent(true);
      setResendCooldown(res.resendCooldownSeconds || 60);
      setInfo(
        t("auth.forgot.emailSent", { email: email.trim().toLowerCase() }),
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? t("auth.forgot.codeFailedToSend"),
      );
    } finally {
      setBusy(false);
    }
  }, [email, t]);

  const verifyOtp = useCallback(async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError(t("auth.forgot.enterCode"));
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await forgotPasswordVerify(
        email.trim().toLowerCase(),
        otp.trim(),
      );
      setVerificationToken(res.verificationToken);
      setStep(3);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t("auth.forgot.codeWrong"));
    } finally {
      setBusy(false);
    }
  }, [email, otp, t]);

  const submit = useCallback(async () => {
    setError(null);
    if (!passwordOk) {
      setError(t("auth.forgot.passwordRulesFail"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.forgot.passwordsDontMatch"));
      return;
    }
    setBusy(true);
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        verificationToken,
        newPassword: password,
        confirmPassword,
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t("auth.forgot.failed"));
    } finally {
      setBusy(false);
    }
  }, [confirmPassword, email, password, passwordOk, t, verificationToken]);

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Icon name="checkmark" size={40} color={colors.success} />
          </View>
          <Text variant="title" color={colors.foreground} style={styles.center}>
            {t("auth.forgot.success")}
          </Text>
          <Text
            variant="body"
            color={colors.mutedForeground}
            style={styles.center}
          >
            {t("auth.forgot.successBody")}
          </Text>
          <Pressable
            onPress={onBackToLogin}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text variant="label" color={colors.primaryForeground}>
              {t("auth.forgot.backToLogin")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Step 1 = email, Step 2 = OTP, Step 3 = password. When otpSent toggles
  // we move from email field to OTP field inside step 1/2.
  const displayStep: Step = step === 3 ? 3 : otpSent ? 2 : 1;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={onBackToLogin}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("auth.forgot.backToLogin")}
            >
              <Icon
                name="chevron-back"
                size={24}
                color={colors.mutedForeground}
              />
            </Pressable>
            <Text variant="caption" color={colors.mutedForeground}>
              {t("auth.forgot.stepXofY", { x: displayStep, y: 3 })}
            </Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.steps}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  s <= displayStep && styles.stepDotActive,
                ]}
              />
            ))}
          </View>

          {step !== 3 ? (
            <View style={styles.section}>
              <Text variant="title" color={colors.foreground}>
                {t("auth.forgot.title")}
              </Text>
              <Text variant="body" color={colors.mutedForeground}>
                {t("auth.forgot.subtitle")}
              </Text>

              <View style={styles.form}>
                <Field
                  label={t("auth.field.email")}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setError(null);
                  }}
                  placeholder={t("auth.field.emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!otpSent}
                />

                {!otpSent ? (
                  <PrimaryButton
                    onPress={sendOtp}
                    busy={busy}
                    label={t("auth.forgot.sendCode")}
                  />
                ) : (
                  <>
                    <Field
                      label={t("auth.forgot.codeLabel")}
                      value={otp}
                      onChangeText={(v) => {
                        setOtp(v.replace(/[^0-9]/g, "").slice(0, 6));
                        setError(null);
                      }}
                      placeholder={t("auth.forgot.codePlaceholder")}
                      keyboardType="number-pad"
                    />
                    <View style={styles.resendRow}>
                      <Pressable
                        onPress={
                          resendCooldown > 0 || busy ? undefined : sendOtp
                        }
                        disabled={resendCooldown > 0 || busy}
                        hitSlop={8}
                      >
                        <Text
                          variant="caption"
                          color={
                            resendCooldown > 0
                              ? colors.faintForeground
                              : colors.primary
                          }
                        >
                          {resendCooldown > 0
                            ? t("auth.forgot.resendIn", { n: resendCooldown })
                            : t("auth.forgot.resend")}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setOtpSent(false);
                          setOtp("");
                          setError(null);
                          setInfo(null);
                        }}
                        hitSlop={8}
                      >
                        <Text variant="caption" color={colors.mutedForeground}>
                          {t("auth.forgot.changeEmail")}
                        </Text>
                      </Pressable>
                    </View>
                    <PrimaryButton
                      onPress={verifyOtp}
                      busy={busy}
                      label={t("auth.forgot.verifyCode")}
                    />
                  </>
                )}
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.section}>
              <Text variant="title" color={colors.foreground}>
                {t("auth.forgot.newPasswordTitle")}
              </Text>
              <Text variant="body" color={colors.mutedForeground}>
                {t("auth.forgot.newPasswordSubtitle")}
              </Text>

              <View style={styles.form}>
                <PasswordField
                  label={t("auth.forgot.newPassword")}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t("auth.field.passwordPlaceholder")}
                />
                <PasswordField
                  label={t("auth.forgot.confirmPassword")}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t("auth.field.passwordPlaceholder")}
                />

                <View style={styles.rules}>
                  {passwordRules.map((r) => (
                    <View key={r.key} style={styles.ruleRow}>
                      <Icon
                        name={r.met ? "checkmark-circle" : "ellipse-outline"}
                        size={14}
                        color={
                          r.met ? colors.success : colors.faintForeground
                        }
                      />
                      <Text
                        variant="caption"
                        color={
                          r.met ? colors.foreground : colors.mutedForeground
                        }
                      >
                        {t(r.key)}
                      </Text>
                    </View>
                  ))}
                </View>

                <PrimaryButton
                  onPress={submit}
                  busy={busy}
                  label={t("auth.forgot.resetPassword")}
                />
              </View>
            </View>
          ) : null}

          {info ? (
            <View style={styles.notice}>
              <StatusBadge tone="info" label={t("auth.register.emailSentBadge")} />
              <Text variant="caption" color={colors.mutedForeground}>
                {info}
              </Text>
            </View>
          ) : null}

          {error ? (
            <Text
              variant="caption"
              color={colors.danger}
              style={styles.center}
            >
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PrimaryButton({
  onPress,
  busy,
  label,
}: {
  onPress: () => void;
  busy: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        busy && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy ? (
        <ActivityIndicator color={colors.primaryForeground} />
      ) : (
        <Text variant="label" color={colors.primaryForeground}>
          {label}
        </Text>
      )}
    </Pressable>
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

function evaluatePassword(p: string): { key: StringKey; met: boolean }[] {
  return [
    { key: "auth.rule.8chars", met: p.length >= 8 },
    { key: "auth.rule.upper", met: /[A-Z]/.test(p) },
    { key: "auth.rule.lower", met: /[a-z]/.test(p) },
    { key: "auth.rule.number", met: /[0-9]/.test(p) },
    { key: "auth.rule.special", met: /[^A-Za-z0-9]/.test(p) },
  ];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
  },
  spacer: { width: 24 },
  steps: { flexDirection: "row", gap: spacing.xs, justifyContent: "center" },
  stepDot: {
    height: 4,
    width: 40,
    borderRadius: 2,
    backgroundColor: colors.muted,
  },
  stepDotActive: { backgroundColor: colors.primary },
  section: { gap: spacing.md },
  form: { gap: spacing.lg, marginTop: spacing.md },
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
  resendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rules: { gap: spacing.xs },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  center: { textAlign: "center" },
  notice: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
});
