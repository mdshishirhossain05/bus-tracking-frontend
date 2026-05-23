import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text variant="caption" color={colors.mutedForeground} style={styles.cardTitle}>
        {title}
      </Text>
      {children}
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
  const { goBack } = useNav();
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
            <Text
              variant="caption"
              color={colors.primary}
              onPress={() => {
                setProfileMsg(null);
                setEditing(true);
              }}
            >
              Edit
            </Text>
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
          <Text variant="caption" color={colors.mutedForeground}>
            {profile?.role}
            {profile?.studentId ? ` · ${profile.studentId}` : ""}
          </Text>
        </View>

        <Card title="ACCOUNT">
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
                  onPress={onSaveProfile}
                  loading={savingProfile}
                  style={styles.flex}
                />
              </View>
            </>
          ) : (
            <>
              <InfoRow label="Email" value={profile?.email} />
              <InfoRow label="Phone" value={profile?.phoneNumber} />
              <InfoRow label="Department" value={profile?.academicDepartment} />
              <InfoRow label="Batch" value={profile?.academicBatch} />
              <InfoRow label="Pickup point" value={profile?.transportPickupPoint} />
            </>
          )}
          {profileMsg ? (
            <Text variant="caption" color={colors.mutedForeground} style={styles.msg}>
              {profileMsg}
            </Text>
          ) : null}
        </Card>

        <Card title="CHANGE PASSWORD">
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

        <Card title="DEVICES">
          {activeSessions.map((s) => (
            <View key={s.id} style={styles.session}>
              <View style={styles.flex}>
                <Text variant="label" color={colors.foreground}>
                  {s.deviceLabel ?? s.userAgentRaw ?? "Device"}
                  {s.current ? "  (this device)" : ""}
                </Text>
                <Text variant="caption" color={colors.faintForeground}>
                  {formatWhen(s.lastSeenAt ?? s.createdAt)}
                </Text>
              </View>
              {!s.current ? (
                <Text
                  variant="caption"
                  color={colors.danger}
                  onPress={() => void onRevoke(s.id)}
                >
                  Revoke
                </Text>
              ) : null}
            </View>
          ))}
          {otherCount > 0 ? (
            <Button
              label="Sign out other devices"
              variant="ghost"
              onPress={onSignOutOthers}
              loading={sessionBusy}
              style={styles.topGap}
            />
          ) : null}
        </Card>

        <Button label="Sign out" variant="danger" onPress={signOut} style={styles.topGap} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="caption" color={colors.mutedForeground}>
        {label}
      </Text>
      <Text variant="body" color={value ? colors.foreground : colors.faintForeground}>
        {value || "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  identity: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: { letterSpacing: 1 },
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
  infoRow: { gap: 2 },
  actionsRow: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
  msg: { marginTop: spacing.xs },
  session: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topGap: { marginTop: spacing.sm },
});
