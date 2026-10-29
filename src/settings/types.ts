export type QueueDisplayMode = "full_name" | "initials" | "ticket_only";

/**
 * 0 = When my ticket is called (NOW SERVING)
 * 2 = When I am 2nd in line
 * 3 = When I am 3rd in line
 */
export type AlertThreshold = 0 | 2 | 3;

export type ThemePreference = "light" | "dark";

export type SettingsTab = "profile" | "privacy" | "notifications" | "security";

export interface UserSettings {
  studentId: string;
  programSection: string;
  contactNumber: string;
  queueDisplayMode: QueueDisplayMode;
  alertThreshold: AlertThreshold;
  audioChimeEnabled: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
  reduceMotion: boolean;
  theme: ThemePreference;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  studentId: "",
  programSection: "",
  contactNumber: "",
  queueDisplayMode: "full_name",
  alertThreshold: 0,
  audioChimeEnabled: true,
  browserNotifications: false,
  emailNotifications: false,
  reduceMotion: false,
  theme: "light",
};

