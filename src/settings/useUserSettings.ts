import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
  type QueueDisplayMode,
  type AlertThreshold,
  type ThemePreference,
} from "./types";
import {
  sanitizeText,
  normalizeContactNumber,
  validateUserSettings,
  validateFullName,
} from "./validation";
import { formatQueueDisplayName } from "../utils/formatQueueDisplayName";

const CLIENT_PREFS_KEY = "sasched_client_prefs_v1";
const userCacheKey = (userId: string) => `sasched_user_settings_v1:${userId}`;

function readLocalSettings(userId: string): UserSettings {
  try {
    const clientRaw = localStorage.getItem(CLIENT_PREFS_KEY);
    const clientPrefs = clientRaw ? JSON.parse(clientRaw) : {};
    const userRaw = userId ? localStorage.getItem(userCacheKey(userId)) : null;
    const userPrefs = userRaw ? JSON.parse(userRaw) : {};

    return {
      ...DEFAULT_USER_SETTINGS,
      ...clientPrefs,
      ...userPrefs,
    };
  } catch {
    return { ...DEFAULT_USER_SETTINGS };
  }
}

function writeLocalSettings(userId: string, settings: UserSettings): void {
  try {
    if (userId) {
      localStorage.setItem(userCacheKey(userId), JSON.stringify(settings));
    }
    localStorage.setItem(
      CLIENT_PREFS_KEY,
      JSON.stringify({
        audioChimeEnabled: settings.audioChimeEnabled,
        browserNotifications: settings.browserNotifications,
        reduceMotion: settings.reduceMotion,
        theme: settings.theme,
      })
    );
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

function mapRowToSettings(row: Record<string, any>, fallback: UserSettings): UserSettings {
  const mode = row.queue_display_mode as QueueDisplayMode;
  const validMode: QueueDisplayMode =
    mode === "full_name" || mode === "initials" || mode === "ticket_only"
      ? mode
      : fallback.queueDisplayMode;

  const thresholdNum = Number(row.alert_threshold);
  const validThreshold: AlertThreshold =
    thresholdNum === 0 || thresholdNum === 2 || thresholdNum === 3
      ? (thresholdNum as AlertThreshold)
      : fallback.alertThreshold;

  const themeVal = row.theme as ThemePreference;
  const validTheme: ThemePreference =
    themeVal === "light" || themeVal === "dark" ? themeVal : fallback.theme;

  return {
    studentId: typeof row.student_id === "string" ? row.student_id : fallback.studentId,
    programSection:
      typeof row.program_section === "string" ? row.program_section : fallback.programSection,
    contactNumber:
      typeof row.contact_number === "string" ? row.contact_number : fallback.contactNumber,
    queueDisplayMode: validMode,
    alertThreshold: validThreshold,
    audioChimeEnabled:
      typeof row.audio_chime_enabled === "boolean"
        ? row.audio_chime_enabled
        : fallback.audioChimeEnabled,
    browserNotifications:
      typeof row.browser_notifications === "boolean"
        ? row.browser_notifications
        : fallback.browserNotifications,
    emailNotifications:
      typeof row.email_notifications === "boolean"
        ? row.email_notifications
        : fallback.emailNotifications,
    reduceMotion:
      typeof row.reduce_motion === "boolean" ? row.reduce_motion : fallback.reduceMotion,
    theme: validTheme,
  };
}

export interface SaveSettingsResult {
  ok: boolean;
  error?: string;
  updatedFullName?: string;
}

export function useUserSettings(userId: string) {
  const [settings, setSettings] = useState<UserSettings>(() => readLocalSettings(userId));
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Sync from localStorage + Supabase when userId changes
  useEffect(() => {
    const cached = readLocalSettings(userId);
    setSettings(cached);

    if (!userId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (!error && data) {
          const merged = mapRowToSettings(data, cached);
          setSettings(merged);
          writeLocalSettings(userId, merged);
        }
      } catch {
        // Fallback to cached local settings
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateQuickSetting = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        writeLocalSettings(userId, next);
        return next;
      });

      if (!userId) return;

      const dbColumnMap: Record<keyof UserSettings, string> = {
        studentId: "student_id",
        programSection: "program_section",
        contactNumber: "contact_number",
        queueDisplayMode: "queue_display_mode",
        alertThreshold: "alert_threshold",
        audioChimeEnabled: "audio_chime_enabled",
        browserNotifications: "browser_notifications",
        emailNotifications: "email_notifications",
        reduceMotion: "reduce_motion",
        theme: "theme",
      };

      const col = dbColumnMap[key];
      try {
        await supabase.from("user_settings").upsert(
          {
            user_id: userId,
            [col]: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch {
        // Persisted in localStorage if DB table is not migrated yet
      }
    },
    [userId]
  );

  const saveSettings = useCallback(
    async (
      draft: UserSettings,
      options?: {
        newFullName?: string;
        currentFullName: string;
      }
    ): Promise<SaveSettingsResult> => {
      const sanitized: UserSettings = {
        ...draft,
        studentId: sanitizeText(draft.studentId, 15).toUpperCase(),
        programSection: sanitizeText(draft.programSection, 50),
        contactNumber: normalizeContactNumber(draft.contactNumber),
      };

      const fieldErrors = validateUserSettings(sanitized);
      const firstError =
        fieldErrors.studentId || fieldErrors.programSection || fieldErrors.contactNumber;
      if (firstError) {
        return { ok: false, error: firstError };
      }

      let updatedFullName: string | undefined;
      if (options?.newFullName !== undefined) {
        const nameErr = validateFullName(options.newFullName);
        if (nameErr) {
          return { ok: false, error: nameErr };
        }
        updatedFullName = sanitizeText(options.newFullName, 80);
      }

      const previousSettings = settings;

      // Optimistic UI update + localStorage persistence
      setSettings(sanitized);
      writeLocalSettings(userId, sanitized);
      setSaving(true);

      try {
        // 1. One-time full name update in Supabase Auth metadata if requested
        if (updatedFullName) {
          const { error: authErr } = await supabase.auth.updateUser({
            data: { display_name: updatedFullName },
          });
          if (authErr) {
            setSettings(previousSettings);
            writeLocalSettings(userId, previousSettings);
            return { ok: false, error: `Could not update full name: ${authErr.message}` };
          }
        }

        // 2. Upsert into public.user_settings
        if (userId) {
          const { error: dbErr } = await supabase.from("user_settings").upsert(
            {
              user_id: userId,
              student_id: sanitized.studentId || null,
              program_section: sanitized.programSection || null,
              contact_number: sanitized.contactNumber || null,
              queue_display_mode: sanitized.queueDisplayMode,
              alert_threshold: sanitized.alertThreshold,
              audio_chime_enabled: sanitized.audioChimeEnabled,
              browser_notifications: sanitized.browserNotifications,
              email_notifications: sanitized.emailNotifications,
              reduce_motion: sanitized.reduceMotion,
              theme: sanitized.theme,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          // If the error is NOT a missing-migration table/column error, surface it and roll back
          if (dbErr) {
            const msg = (dbErr.message || "").toLowerCase();
            const isMigrationPending =
              dbErr.code === "42P01" ||
              dbErr.code === "PGRST204" ||
              dbErr.code === "PGRST205" ||
              msg.includes("user_settings") ||
              msg.includes("does not exist") ||
              msg.includes("schema cache");

            if (!isMigrationPending) {
              setSettings(previousSettings);
              writeLocalSettings(userId, previousSettings);
              return { ok: false, error: `Failed to save settings: ${dbErr.message}` };
            }
          }

          // 3. Update active queue ticket's public_display_name so live queue reflects privacy setting immediately
          const effectiveName = updatedFullName || options?.currentFullName || "SASCHED User";
          const formattedPublicName = formatQueueDisplayName(
            effectiveName,
            sanitized.queueDisplayMode
          );

          const ticketUpdatePayload: Record<string, string> = {
            public_display_name: formattedPublicName,
          };
          if (updatedFullName) {
            ticketUpdatePayload.user_name = updatedFullName;
          }

          const { error: ticketErr } = await supabase
            .from("queue_tickets")
            .update(ticketUpdatePayload)
            .eq("account_id", userId)
            .in("status", ["waiting", "serving"]);

          // Fallback if public_display_name column is not migrated yet but full name was updated
          if (ticketErr && updatedFullName) {
            await supabase
              .from("queue_tickets")
              .update({ user_name: updatedFullName })
              .eq("account_id", userId)
              .in("status", ["waiting", "serving"]);
          }
        }

        return { ok: true, updatedFullName };
      } catch (err: any) {
        setSettings(previousSettings);
        writeLocalSettings(userId, previousSettings);
        return {
          ok: false,
          error: err?.message || "Unexpected network error while saving settings.",
        };
      } finally {
        setSaving(false);
      }
    },
    [settings, userId]
  );

  return {
    settings,
    loading,
    saving,
    saveSettings,
    updateQuickSetting,
  };
}

