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
  ACADEMIC_BATCH_PLACEHOLDER,
  ACADEMIC_DEPARTMENTS,
  colors,
  fonts,
  radius,
  spacing,
  registerPassenger,
  requestRegisterOtp,
  verifyRegisterOtp,
  useT,
  type StringKey,
} from "@ubts/shared";
import { PasswordField } from "../components/PasswordField";

type Step = 1 | 2 | 3;

interface RegisterScreenProps {
  onBackToLogin: () => void;
}

export function RegisterScreen({ onBackToLogin }: RegisterScreenProps) {
  const t = useT();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Step 1: email + otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");

  // Step 2: profile
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [pickup, setPickup] = useState("");

  // Step 3: password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState<{ fullName: string; email: string } | null>(
    null,
  );

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
      setError(t("auth.register.errors.email"));
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await requestRegisterOtp(email.trim().toLowerCase());
      setOtpSent(true);
      setResendCooldown(res.resendCooldownSeconds || 60);
      setInfo(
        t("auth.forgot.emailSent", { email: email.trim().toLowerCase() }),
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? t("auth.register.errors.send"),
      );
    } finally {
      setBusy(false);
    }
  }, [email, t]);

  const verifyOtp = useCallback(async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError(t("auth.register.errors.otp"));
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await verifyRegisterOtp(email.trim().toLowerCase(), otp.trim());
      setEmailVerificationToken(res.emailVerificationToken);
      setStep(2);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? t("auth.register.errors.verify"),
      );
    } finally {
      setBusy(false);
    }
  }, [email, otp, t]);

  const goToPassword = useCallback(() => {
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError(t("auth.register.errors.fullName"));
      return;
    }
    if (!studentId.trim() || studentId.trim().length < 3) {
      setError(t("auth.register.errors.studentId"));
      return;
    }
    setStep(3);
  }, [fullName, studentId, t]);

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
      const result = await registerPassenger({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        studentId: studentId.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        academicDepartment: department.trim() || undefined,
        academicBatch: batch.trim() || undefined,
        transportPickupPoint: pickup.trim() || undefined,
        emailVerificationToken,
      });
      setDone({
        fullName: result.user.fullName,
        email: result.user.email,
      });
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? t("auth.register.errors.registration"),
      );
    } finally {
      setBusy(false);
    }
  }, [
    batch,
    confirmPassword,
    department,
    email,
    emailVerificationToken,
    fullName,
    password,
    passwordOk,
    phoneNumber,
    pickup,
    studentId,
    t,
  ]);

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Icon name="checkmark" size={40} color={colors.success} />
          </View>
          <Text variant="title" color={colors.foreground} style={styles.center}>
            {t("auth.register.welcome", { name: done.fullName.split(" ")[0] })}
          </Text>
          <Text
            variant="body"
            color={colors.mutedForeground}
            style={styles.center}
          >
            {t("auth.register.successBody")}
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
              {t("auth.forgot.stepXofY", { x: step, y: 3 })}
            </Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.steps}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  s <= step && styles.stepDotActive,
                ]}
              />
            ))}
          </View>

          {step === 1 ? (
            <View style={styles.section}>
              <Text variant="title" color={colors.foreground}>
                {t("auth.register.verifyTitle")}
              </Text>
              <Text variant="body" color={colors.mutedForeground}>
                {t("auth.register.verifySubtitle")}
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

          {step === 2 ? (
            <View style={styles.section}>
              <Text variant="title" color={colors.foreground}>
                {t("auth.register.aboutYou")}
              </Text>
              <Text variant="body" color={colors.mutedForeground}>
                {t("auth.register.aboutYouSubtitle")}
              </Text>

              <View style={styles.form}>
                <Field
                  label={t("auth.register.fullName")}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t("auth.register.fullNamePlaceholder")}
                  autoCapitalize="words"
                />
                <Field
                  label={t("auth.register.studentId")}
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="221-15-XXXX"
                  autoCapitalize="characters"
                />
                <Field
                  label={t("auth.register.phoneOptional")}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+880 1XXX XXXXXX"
                  keyboardType="phone-pad"
                />

                <View style={styles.field}>
                  <Text variant="caption" color={colors.mutedForeground}>
                    {t("auth.register.deptOptional")}
                  </Text>
                  <View style={styles.deptGrid}>
                    {ACADEMIC_DEPARTMENTS.map((d) => {
                      const active = department === d;
                      return (
                        <Pressable
                          key={d}
                          onPress={() => setDepartment(active ? "" : d)}
                          style={[
                            styles.deptChip,
                            active && styles.deptChipActive,
                          ]}
                        >
                          <Text
                            variant="caption"
                            color={
                              active
                                ? colors.primaryForeground
                                : colors.foreground
                            }
                          >
                            {shortenDept(d)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Field
                  label={t("auth.register.batchOptional")}
                  value={batch}
                  onChangeText={setBatch}
                  placeholder={ACADEMIC_BATCH_PLACEHOLDER}
                />
                <Field
                  label={t("auth.register.pickupOptional")}
                  value={pickup}
                  onChangeText={setPickup}
                  placeholder={t("auth.register.pickupPlaceholder")}
                />

                <PrimaryButton
                  onPress={goToPassword}
                  busy={false}
                  label={t("auth.register.continue")}
                />
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.section}>
              <Text variant="title" color={colors.foreground}>
                {t("auth.register.setPasswordTitle")}
              </Text>
              <Text variant="body" color={colors.mutedForeground}>
                {t("auth.register.setPasswordSubtitle")}
              </Text>

              <View style={styles.form}>
                <PasswordField
                  label={t("auth.field.password")}
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
                        name={
                          r.met ? "checkmark-circle" : "ellipse-outline"
                        }
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
                  label={t("auth.register.createAccount")}
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

function shortenDept(name: string): string {
  // Show the abbreviation in parens if present, else the full name.
  const m = name.match(/\(([^)]+)\)/);
  return m?.[1] ?? name;
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
  deptGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  deptChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
  deptChipActive: { backgroundColor: colors.primary },
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
