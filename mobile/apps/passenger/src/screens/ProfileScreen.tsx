import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Button,
  ScreenHeader,
  Icon,
  colors,
  spacing,
  radius,
  fonts,
  useAuth,
  getProfile,
  updateProfile,
  changePassword,
  listSessions,
  revokeSession,
  logoutOtherSessions,
  useI18n,
  LOCALES,
  LOCALE_LABELS,
  type IconName,
  type Locale,
} from "@ubts/shared";
import type { SessionInfo, UserProfile } from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";

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

function Card({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name={icon} size={15} color={colors.mutedForeground} />
        <Text variant="caption" color={colors.mutedForeground} style={styles.cardTitle}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color={colors.faintForeground} />
      <View style={styles.flex}>
        <Text variant="caption" color={colors.faintForeground}>
          {label}
        </Text>
        <Text variant="body" color={value ? colors.foreground : colors.faintForeground}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

function formatWhen(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export function ProfileScreen() {
  const { goBack, navigate } = useNav();
  const { t, locale, setLocale } = useI18n();
  const { signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [pickup, setPickup] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionBusy, setSessionBusy] = useState(false);

  const hydrate = useCallback((p: UserProfile) => {
    setFullName(p.fullName ?? "");
    setEmail(p.email ?? "");
    setPhoneNumber(p.phoneNumber ?? "");
    setDepartment(p.academicDepartment ?? "");
    setBatch(p.academicBatch ?? "");
    setPickup(p.transportPickupPoint ?? "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        getProfile().catch(() => null),
        listSessions().catch(() => [] as SessionInfo[]),
      ]);
      if (p) {
        setProfile(p);
        hydrate(p);
      }
      setSessions(s);
    } finally {
      setLoading(false);
    }
  }, [hydrate]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSaveProfile = useCallback(async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const updated = await updateProfile({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim() || undefined,
        academicDepartment: department.trim(),
        academicBatch: batch.trim(),
        transportPickupPoint: pickup.trim(),
      });
      if (updated) {
        setProfile(updated);
        hydrate(updated);
      }
      setEditing(false);
      setProfileMsg("Profile updated.");
    } catch (err: any) {
      setProfileMsg(err?.response?.data?.message ?? "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  }, [fullName, email, phoneNumber, department, batch, pickup, hydrate]);

  const onChangePassword = useCallback(async () => {
    setPasswordMsg(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg("New password and confirmation do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordMsg("Password changed.");
    } catch (err: any) {
      setPasswordMsg(err?.response?.data?.message ?? "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  }, [currentPassword, newPassword, confirmNewPassword]);

  const onSignOutOthers = useCallback(async () => {
    setSessionBusy(true);
    try {
      await logoutOtherSessions();
      setSessions(await listSessions().catch(() => []));
    } finally {
      setSessionBusy(false);
    }
  }, []);

  const onRevoke = useCallback(async (sessionId: string) => {
    setSessionBusy(true);
    try {
      await revokeSession(sessionId);
      setSessions(await listSessions().catch(() => []));
    } finally {
      setSessionBusy(false);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Profile" onBack={goBack} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const activeSessions = sessions.filter((s) => !s.revokedAt);
  const otherCount = activeSessions.filter((s) => !s.current).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Profile"
        onBack={goBack}
        right={
          !editing ? (
            <Pressable
              onPress={() => {
                setProfileMsg(null);
                setEditing(true);
              }}
              hitSlop={10}
              style={styles.editBtn}
            >
              <Icon name="create-outline" size={18} color={colors.primary} />
            </Pressable>
          ) : null
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text variant="title" color={colors.primaryForeground}>
              {(profile?.fullName ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="subtitle" color={colors.foreground}>
            {profile?.fullName}
          </Text>
          <View style={styles.roleChip}>
            <Text variant="caption" color={colors.primary}>
              {(profile?.role ?? "PASSENGER").toUpperCase()}
              {profile?.studentId ? ` · ${profile.studentId}` : ""}
            </Text>
          </View>
        </View>

        <Card icon="person-circle-outline" title="ACCOUNT">
          {editing ? (
            <>
              <Field label="Full name" value={fullName} onChangeText={setFullName} />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Phone"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <Field label="Department" value={department} onChangeText={setDepartment} />
              <Field label="Batch" value={batch} onChangeText={setBatch} />
              <Field label="Pickup point" value={pickup} onChangeText={setPickup} />
              <View style={styles.actionsRow}>
                <Button
                  label="Cancel"
                  variant="ghost"
                  onPress={() => {
                    if (profile) hydrate(profile);
                    setEditing(false);
                    setProfileMsg(null);
                  }}
                  style={styles.flex}
                />
                <Button
                  label="Save"
                  icon="checkmark"
                  onPress={onSaveProfile}
                  loading={savingProfile}
                  style={styles.flex}
                />
              </View>
            </>
          ) : (
            <>
              <InfoRow icon="mail-outline" label="Email" value={profile?.email} />
              <InfoRow icon="call-outline" label="Phone" value={profile?.phoneNumber} />
              <InfoRow
                icon="school-outline"
                label="Department"
                value={profile?.academicDepartment}
              />
              <InfoRow
                icon="calendar-outline"
                label="Batch"
                value={profile?.academicBatch}
              />
              <InfoRow
                icon="location-outline"
                label="Pickup point"
                value={profile?.transportPickupPoint}
              />
            </>
          )}
          {profileMsg ? (
            <Text variant="caption" color={colors.mutedForeground} style={styles.msg}>
              {profileMsg}
            </Text>
          ) : null}
        </Card>

        <Card icon="lock-closed-outline" title="CHANGE PASSWORD">
          <Field
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <Field
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Field
            label="Confirm new password"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry
          />
          <Button
            label="Update password"
            variant="secondary"
            onPress={onChangePassword}
            loading={savingPassword}
            disabled={!currentPassword || !newPassword || !confirmNewPassword}
          />
          {passwordMsg ? (
            <Text variant="caption" color={colors.mutedForeground} style={styles.msg}>
              {passwordMsg}
            </Text>
          ) : null}
        </Card>

        <Pressable
          onPress={() => navigate("notificationPreferences")}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("profile.notificationsTitle")}
          accessibilityHint={t("profile.notificationsSubtitle")}
        >
          <View style={styles.cardHeader}>
            <Icon
              name="notifications-outline"
              size={15}
              color={colors.mutedForeground}
            />
            <Text
              variant="caption"
              color={colors.mutedForeground}
              style={styles.cardTitle}
            >
              {t("profile.notifications")}
            </Text>
          </View>
          <View style={styles.notifRow}>
            <View style={styles.flex}>
              <Text variant="label" color={colors.foreground}>
                {t("profile.notificationsTitle")}
              </Text>
              <Text variant="caption" color={colors.mutedForeground}>
                {t("profile.notificationsSubtitle")}
              </Text>
            </View>
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.mutedForeground}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => navigate("history")}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("profile.tripHistoryTitle")}
          accessibilityHint={t("profile.tripHistorySubtitle")}
        >
          <View style={styles.cardHeader}>
            <Icon
              name="time-outline"
              size={15}
              color={colors.mutedForeground}
            />
            <Text
              variant="caption"
              color={colors.mutedForeground}
              style={styles.cardTitle}
            >
              {t("profile.tripHistory")}
            </Text>
          </View>
          <View style={styles.notifRow}>
            <View style={styles.flex}>
              <Text variant="label" color={colors.foreground}>
                {t("profile.tripHistoryTitle")}
              </Text>
              <Text variant="caption" color={colors.mutedForeground}>
                {t("profile.tripHistorySubtitle")}
              </Text>
            </View>
            <Icon
              name="chevron-forward"
              size={18}
              color={colors.mutedForeground}
            />
          </View>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon
              name="language-outline"
              size={15}
              color={colors.mutedForeground}
            />
            <Text
              variant="caption"
              color={colors.mutedForeground}
              style={styles.cardTitle}
            >
              {t("profile.language")}
            </Text>
          </View>
          <View style={styles.langGrid}>
            {LOCALES.map((code) => {
              const active = code === locale;
              return (
                <Pressable
                  key={code}
                  onPress={() => setLocale(code as Locale)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={LOCALE_LABELS[code as Locale].english}
                  style={[styles.langChip, active && styles.langChipActive]}
                >
                  <Text
                    variant="label"
                    color={
                      active ? colors.primaryForeground : colors.foreground
                    }
                  >
                    {LOCALE_LABELS[code as Locale].native}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption" color={colors.mutedForeground}>
            {t("profile.languageHelp")}
          </Text>
        </View>

        <Card icon="phone-portrait-outline" title="DEVICES">
          {activeSessions.map((s, i) => (
            <View
              key={s.id}
              style={[styles.session, i === activeSessions.length - 1 && styles.sessionLast]}
            >
              <Icon name="hardware-chip-outline" size={18} color={colors.faintForeground} />
              <View style={styles.flex}>
                <View style={styles.sessionTitle}>
                  <Text variant="label" color={colors.foreground} numberOfLines={1}>
                    {s.deviceLabel ?? s.userAgentRaw ?? "Device"}
                  </Text>
                  {s.current ? (
                    <View style={styles.thisChip}>
                      <Text variant="caption" color={colors.success}>
                        This device
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="caption" color={colors.faintForeground}>
                  {formatWhen(s.lastSeenAt ?? s.createdAt)}
                </Text>
              </View>
              {!s.current ? (
                <Pressable onPress={() => void onRevoke(s.id)} hitSlop={8}>
                  <Icon name="close-circle-outline" size={20} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
          ))}
          {otherCount > 0 ? (
            <Button
              label="Sign out other devices"
              variant="ghost"
              icon="log-out-outline"
              onPress={onSignOutOthers}
              loading={sessionBusy}
              style={styles.topGap}
            />
          ) : null}
        </Card>

        <Button
          label="Sign out"
          variant="danger"
          icon="log-out-outline"
          onPress={signOut}
          style={styles.topGap}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  roleChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  cardTitle: { letterSpacing: 1.2 },
  cardPressed: { opacity: 0.85 },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  langGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  langChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.muted,
    borderRadius: radius.pill,
  },
  langChipActive: { backgroundColor: colors.primary },
  field: { gap: spacing.xs },
  input: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  actionsRow: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
  msg: { marginTop: spacing.xs },
  session: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sessionLast: { borderBottomWidth: 0 },
  sessionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thisChip: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  topGap: { marginTop: spacing.sm },
});
