import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  ShieldCheck,
  BellRinging,
  Lock,
  IdentificationCard,
  GraduationCap,
  Phone,
  Eye,
  EyeSlash,
  SpeakerHigh,
  EnvelopeSimple,
  CheckCircle,
  WarningCircle,
  Key,
  SignOut,
  Check,
  Sliders,
  Sun,
  Moon,
  LightningSlash,
} from "@phosphor-icons/react";
import { supabase } from "../supabaseClient";
import type {
  UserSettings,
  SettingsTab,
  QueueDisplayMode,
  AlertThreshold,
} from "./types";
import {
  validateUserSettings,
  validateFullName,
  type ValidationErrors,
} from "./validation";
import { formatQueueDisplayName } from "../utils/formatQueueDisplayName";
import type { SaveSettingsResult } from "./useUserSettings";

interface SettingsModalProps {
  isOpen: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
  userName: string;
  userEmail: string;
  activeTicketNumber?: string | null;
  settings: UserSettings;
  saving: boolean;
  onSave: (
    draft: UserSettings,
    options?: { newFullName?: string; currentFullName: string }
  ) => Promise<SaveSettingsResult>;
  onTestChime: () => void;
  onShowToast: (msg: string) => void;
  onFullNameUpdated?: (newName: string) => void;
}

const PROGRAM_SUGGESTIONS = [
  "BSIT - 101",
  "BSIT - 502",
  "BSCS - 301",
  "BSBA - 201",
  "BSHM - 102",
  "STEM - 12A",
];

export default function SettingsModal({
  isOpen,
  initialTab = "profile",
  onClose,
  userName,
  userEmail,
  activeTicketNumber,
  settings,
  saving,
  onSave,
  onTestChime,
  onShowToast,
  onFullNameUpdated,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [draft, setDraft] = useState<UserSettings>(settings);

  // One-time Full Name edit exception if name is missing, empty, or literally "SASCHED User"
  const canEditFullName =
    !userName ||
    !userName.trim() ||
    userName.trim().toLowerCase() === "sasched user";
  const [fullNameInput, setFullNameInput] = useState<string>(
    canEditFullName ? "" : userName
  );

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formBannerError, setFormBannerError] = useState<string | null>(null);

  // Browser notification permission state
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  // Password update state (Tab 4)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);

  // Sync draft when modal opens or external settings update
  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setActiveTab(initialTab);
      setErrors({});
      setFormBannerError(null);
      setFullNameInput(
        !userName || userName.trim().toLowerCase() === "sasched user"
          ? ""
          : userName
      );
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotifPermission(Notification.permission);
      }
    }
  }, [isOpen, initialTab, settings, userName]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving && !pwLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, pwLoading, onClose]);

  if (!isOpen) return null;

  const effectivePreviewName =
    canEditFullName && fullNameInput.trim()
      ? fullNameInput.trim()
      : userName || "Mark Andrie A. Cantara";

  const hasUnsavedChanges =
    draft.studentId !== settings.studentId ||
    draft.programSection !== settings.programSection ||
    draft.contactNumber !== settings.contactNumber ||
    draft.queueDisplayMode !== settings.queueDisplayMode ||
    draft.alertThreshold !== settings.alertThreshold ||
    draft.audioChimeEnabled !== settings.audioChimeEnabled ||
    draft.browserNotifications !== settings.browserNotifications ||
    draft.emailNotifications !== settings.emailNotifications ||
    draft.reduceMotion !== settings.reduceMotion ||
    draft.theme !== settings.theme ||
    (canEditFullName && fullNameInput.trim().length > 0);

  const handleFieldChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setFormBannerError(null);

    // Live field-level validation
    const nextErrors = validateUserSettings(next);
    setErrors((prev) => ({
      ...prev,
      studentId: nextErrors.studentId,
      programSection: nextErrors.programSection,
      contactNumber: nextErrors.contactNumber,
    }));
  };

  const handleToggleBrowserNotifications = async () => {
    if (!("Notification" in window)) {
      onShowToast("Browser notifications are not supported on this device.");
      return;
    }

    if (draft.browserNotifications) {
      handleFieldChange("browserNotifications", false);
      return;
    }

    // Request permission if not granted yet
    if (Notification.permission === "granted") {
      setNotifPermission("granted");
      handleFieldChange("browserNotifications", true);
      return;
    }

    if (Notification.permission === "denied") {
      setNotifPermission("denied");
      onShowToast(
        "Notifications are blocked by your browser. Enable them in your browser site settings."
      );
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === "granted") {
        handleFieldChange("browserNotifications", true);
        try {
          new Notification("SASCHED Alerts Enabled", {
            body: "You will be notified here when your queue turn approaches.",
            icon: "/logo.png",
          });
        } catch {
          // Ignore notification constructor error on mobile webviews
        }
      } else {
        handleFieldChange("browserNotifications", false);
        onShowToast("Browser notification permission was not granted.");
      }
    } catch {
      onShowToast("Could not request notification permission.");
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormBannerError(null);

    const nextErrors = validateUserSettings(draft);
    if (canEditFullName && fullNameInput.trim().length > 0) {
      const nameErr = validateFullName(fullNameInput);
      if (nameErr) nextErrors.fullName = nameErr;
    }

    setErrors(nextErrors);

    if (
      nextErrors.fullName ||
      nextErrors.studentId ||
      nextErrors.programSection ||
      nextErrors.contactNumber
    ) {
      setActiveTab("profile");
      setFormBannerError(
        nextErrors.fullName ||
          nextErrors.studentId ||
          nextErrors.programSection ||
          nextErrors.contactNumber ||
          "Please fix the highlighted fields."
      );
      return;
    }

    const res = await onSave(draft, {
      newFullName:
        canEditFullName && fullNameInput.trim().length > 0
          ? fullNameInput.trim()
          : undefined,
      currentFullName: userName,
    });

    if (!res.ok) {
      setFormBannerError(res.error || "Failed to save settings.");
      return;
    }

    if (res.updatedFullName && onFullNameUpdated) {
      onFullNameUpdated(res.updatedFullName);
    }

    onShowToast("Profile & settings saved successfully!");
    onClose();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPassword) {
      setPwError("Please enter your current password to verify your identity.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwError("New password must be different from your current password.");
      return;
    }

    setPwLoading(true);
    try {
      // 1. Re-authenticate current password
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (verifyErr) {
        setPwError("Current password is incorrect.");
        setPwLoading(false);
        return;
      }

      // 2. Update password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setPwError(updateErr.message);
      } else {
        setPwSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onShowToast("Account password updated!");
      }
    } catch (err: any) {
      setPwError(err?.message || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleSignOutScope = async (scope: "others" | "global") => {
    setSessionActionLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope });
      if (error) {
        onShowToast(`Session sign-out failed: ${error.message}`);
      } else if (scope === "others") {
        onShowToast("Signed out of all other active devices.");
      } else {
        onClose();
      }
    } catch {
      onShowToast("Could not complete session sign-out.");
    } finally {
      setSessionActionLoading(false);
    }
  };

  const tabs: {
    id: SettingsTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "profile",
      label: "Profile & Identity",
      shortLabel: "Profile",
      icon: <User size={16} weight="bold" />,
    },
    {
      id: "privacy",
      label: "Queue & Privacy",
      shortLabel: "Queue Privacy",
      icon: <Eye size={16} weight="bold" />,
    },
    {
      id: "notifications",
      label: "Notifications & Sound",
      shortLabel: "Notifications",
      icon: <BellRinging size={16} weight="bold" />,
    },
    {
      id: "security",
      label: "Security & Display",
      shortLabel: "Security",
      icon: <ShieldCheck size={16} weight="bold" />,
    },
  ];

  const displayModes: {
    value: QueueDisplayMode;
    title: string;
    preview: string;
    desc: string;
    badge: string;
  }[] = [
    {
      value: "full_name",
      title: "Full Name",
      preview: formatQueueDisplayName(effectivePreviewName, "full_name"),
      desc: "Shows your full student name on the Cashier and Registrar waiting boards.",
      badge: "Default",
    },
    {
      value: "initials",
      title: "Initials & Last Name",
      preview: formatQueueDisplayName(effectivePreviewName, "initials"),
      desc: "Abbreviates your given names to initials while keeping your last name visible.",
      badge: "Balanced Privacy",
    },
    {
      value: "ticket_only",
      title: "Ticket Number Only",
      preview: "Anonymous",
      desc: "Masks your name as 'Anonymous' on the public board (staff & admin still see your full name).",
      badge: "Maximum Privacy",
    },
  ];

  const thresholdOptions: {
    value: AlertThreshold;
    title: string;
    desc: string;
  }[] = [
    {
      value: 0,
      title: "When my ticket is called (NOW SERVING)",
      desc: "Alerts you at the exact moment the window calls your ticket number.",
    },
    {
      value: 2,
      title: "When I am 2nd in line",
      desc: "Sends an early heads-up when only 1 person is ahead of you, plus when called.",
    },
    {
      value: 3,
      title: "When I am 3rd in line",
      desc: "Sends an advance heads-up when 2 people are ahead of you, plus when called.",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !saving) onClose();
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9996,
          background: "rgba(15, 23, 42, 0.62)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          fontFamily: "'Outfit', 'DM Sans', sans-serif",
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", damping: 26, stiffness: 340 }}
          style={{
            background: "white",
            borderRadius: 24,
            width: "100%",
            maxWidth: 780,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow:
              "0 25px 70px -12px rgba(15, 23, 42, 0.32), 0 0 0 1px rgba(226, 232, 240, 0.9)",
          }}
        >
          {/* ── MODAL HEADER ──────────────────────────────────────────── */}
          <div
            style={{
              padding: "20px 26px",
              borderBottom: "1px solid var(--slate-200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                <Sliders size={20} weight="bold" />
              </div>
              <div>
                <h2
                  id="settings-modal-title"
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--slate-800)",
                    letterSpacing: "-0.01em",
                    margin: 0,
                  }}
                >
                  Profile & Settings
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--slate-500)",
                    marginTop: 1,
                  }}
                >
                  Manage your student identity, live queue privacy, and alert preferences
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings modal"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--slate-200)",
                background: "white",
                color: "var(--slate-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          {/* ── BODY: SIDEBAR + TAB CONTENT ───────────────────────────── */}
          <div
            className="settings-modal-body"
            style={{
              display: "grid",
              gridTemplateColumns: "215px 1fr",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <style>{`
              @media (max-width: 680px) {
                .settings-modal-body {
                  grid-template-columns: 1fr !important;
                  grid-template-rows: auto 1fr !important;
                }
                .settings-tab-rail {
                  flex-direction: row !important;
                  overflow-x: auto !important;
                  border-right: none !important;
                  border-bottom: 1px solid var(--slate-200) !important;
                  padding: 10px 14px !important;
                  gap: 6px !important;
                }
                .settings-tab-btn {
                  white-space: nowrap !important;
                  padding: 8px 12px !important;
                }
              }
            `}</style>

            {/* Left Vertical Tab Rail */}
            <div
              className="settings-tab-rail"
              role="tablist"
              aria-label="Settings sections"
              style={{
                background: "var(--slate-50)",
                borderRight: "1px solid var(--slate-200)",
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {tabs.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className="settings-tab-btn"
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 13px",
                      borderRadius: 12,
                      border: isActive
                        ? "1px solid rgba(37, 99, 235, 0.25)"
                        : "1px solid transparent",
                      background: isActive ? "white" : "transparent",
                      color: isActive ? "var(--blue-700)" : "var(--slate-600)",
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "'Outfit', sans-serif",
                      boxShadow: isActive
                        ? "0 2px 8px rgba(15, 23, 42, 0.05)"
                        : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? "var(--blue-600)" : "var(--slate-400)",
                        display: "flex",
                      }}
                    >
                      {t.icon}
                    </span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Tab Panel Content */}
            <div
              role="tabpanel"
              style={{
                padding: "24px 26px",
                overflowY: "auto",
                maxHeight: "65vh",
              }}
            >
              {formBannerError && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#dc2626",
                  }}
                >
                  <WarningCircle size={16} weight="fill" color="#dc2626" />
                  <span>{formBannerError}</span>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 1: PROFILE & STUDENT IDENTITY                        */}
              {/* ══════════════════════════════════════════════════════════ */}
              {activeTab === "profile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "var(--slate-800)",
                        marginBottom: 4,
                      }}
                    >
                      Student Identity & Contact Details
                    </div>
                    <div style={{ fontSize: 12, color: "var(--slate-500)" }}>
                      Keep your institutional details accurate so Cashier and Registrar staff can verify your records faster.
                    </div>
                  </div>

                  {/* Full Name + Email Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {/* Full Name */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <label
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--slate-600)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Full Name
                        </label>
                        {!canEditFullName && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--slate-500)",
                              background: "var(--slate-100)",
                              padding: "2px 7px",
                              borderRadius: 99,
                            }}
                          >
                            <Lock size={10} weight="bold" /> Verified
                          </span>
                        )}
                      </div>

                      {canEditFullName ? (
                        <>
                          <input
                            type="text"
                            value={fullNameInput}
                            onChange={(e) => setFullNameInput(e.target.value)}
                            placeholder="Enter your official full name"
                            style={{
                              width: "100%",
                              padding: "10px 13px",
                              borderRadius: 11,
                              border: errors.fullName
                                ? "1.5px solid #ef4444"
                                : "1.5px solid var(--blue-300)",
                              background: "white",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--slate-800)",
                              fontFamily: "'Outfit', sans-serif",
                              outline: "none",
                            }}
                          />
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--blue-600)",
                              marginTop: 5,
                              lineHeight: 1.4,
                            }}
                          >
                            One-time setup: Set your official student name for queue tickets.
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={userName}
                            readOnly
                            disabled
                            style={{
                              width: "100%",
                              padding: "10px 13px",
                              borderRadius: 11,
                              border: "1.5px solid var(--slate-200)",
                              background: "var(--slate-50)",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--slate-600)",
                              fontFamily: "'Outfit', sans-serif",
                              cursor: "not-allowed",
                            }}
                          />
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--slate-400)",
                              marginTop: 5,
                              lineHeight: 1.4,
                            }}
                          >
                            Contact the Registrar to update your official name.
                          </div>
                        </>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <label
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--slate-600)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Email Address
                        </label>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--slate-500)",
                            background: "var(--slate-100)",
                            padding: "2px 7px",
                            borderRadius: 99,
                          }}
                        >
                          <Lock size={10} weight="bold" /> Auth Linked
                        </span>
                      </div>
                      <input
                        type="email"
                        value={userEmail}
                        readOnly
                        disabled
                        style={{
                          width: "100%",
                          padding: "10px 13px",
                          borderRadius: 11,
                          border: "1.5px solid var(--slate-200)",
                          background: "var(--slate-50)",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--slate-600)",
                          fontFamily: "'Outfit', sans-serif",
                          cursor: "not-allowed",
                        }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--slate-400)",
                          marginTop: 5,
                          lineHeight: 1.4,
                        }}
                      >
                        Bound to your login credentials.
                      </div>
                    </div>
                  </div>

                  {/* Student ID Number */}
                  <div>
                    <label
                      htmlFor="settings-student-id"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--slate-700)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: 6,
                      }}
                    >
                      <IdentificationCard size={14} color="var(--blue-600)" weight="bold" />
                      Student / Institutional ID Number
                    </label>
                    <input
                      id="settings-student-id"
                      type="text"
                      maxLength={15}
                      placeholder="02000123456"
                      value={draft.studentId}
                      onChange={(e) => handleFieldChange("studentId", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 11,
                        border: errors.studentId
                          ? "1.5px solid #ef4444"
                          : "1.5px solid var(--slate-200)",
                        fontSize: 13,
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 700,
                        color: "var(--slate-800)",
                        outline: "none",
                      }}
                    />
                    {errors.studentId ? (
                      <div style={{ fontSize: 11, color: "#dc2626", marginTop: 5, fontWeight: 600 }}>
                        {errors.studentId}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "var(--slate-400)", marginTop: 5 }}>
                        6–15 letters, digits, or hyphens (e.g., 02000123456).
                      </div>
                    )}
                  </div>

                  {/* Program / Year & Section */}
                  <div>
                    <label
                      htmlFor="settings-program-section"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--slate-700)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: 6,
                      }}
                    >
                      <GraduationCap size={14} color="var(--blue-600)" weight="bold" />
                      Program / Year & Section
                    </label>
                    <input
                      id="settings-program-section"
                      type="text"
                      maxLength={50}
                      placeholder="e.g., BSIT - 502"
                      value={draft.programSection}
                      onChange={(e) => handleFieldChange("programSection", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 11,
                        border: errors.programSection
                          ? "1.5px solid #ef4444"
                          : "1.5px solid var(--slate-200)",
                        fontSize: 13,
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 600,
                        color: "var(--slate-800)",
                        outline: "none",
                      }}
                    />
                    {/* Quick preset chips */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {PROGRAM_SUGGESTIONS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleFieldChange("programSection", preset)}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: 99,
                            border:
                              draft.programSection === preset
                                ? "1px solid var(--blue-500)"
                                : "1px solid var(--slate-200)",
                            background:
                              draft.programSection === preset
                                ? "var(--blue-50)"
                                : "var(--slate-50)",
                            color:
                              draft.programSection === preset
                                ? "var(--blue-700)"
                                : "var(--slate-500)",
                            cursor: "pointer",
                            fontFamily: "'Outfit', sans-serif",
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    {errors.programSection && (
                      <div style={{ fontSize: 11, color: "#dc2626", marginTop: 5, fontWeight: 600 }}>
                        {errors.programSection}
                      </div>
                    )}
                  </div>

                  {/* Mobile Contact Number */}
                  <div>
                    <label
                      htmlFor="settings-contact-number"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--slate-700)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: 6,
                      }}
                    >
                      <Phone size={14} color="var(--blue-600)" weight="bold" />
                      Mobile Contact Number
                    </label>
                    <input
                      id="settings-contact-number"
                      type="tel"
                      maxLength={16}
                      placeholder="09171234567 or +639171234567"
                      value={draft.contactNumber}
                      onChange={(e) => handleFieldChange("contactNumber", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 11,
                        border: errors.contactNumber
                          ? "1.5px solid #ef4444"
                          : "1.5px solid var(--slate-200)",
                        fontSize: 13,
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 600,
                        color: "var(--slate-800)",
                        outline: "none",
                      }}
                    />
                    {errors.contactNumber ? (
                      <div style={{ fontSize: 11, color: "#dc2626", marginTop: 5, fontWeight: 600 }}>
                        {errors.contactNumber}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "var(--slate-400)", marginTop: 5 }}>
                        Used only for urgent Registrar or Cashier follow-ups. Never shown publicly.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 2: QUEUE & PRIVACY PREFERENCES                       */}
              {/* ══════════════════════════════════════════════════════════ */}
              {activeTab === "privacy" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Live Queue Preview Box */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                      borderRadius: 16,
                      padding: "16px 18px",
                      color: "white",
                      boxShadow: "0 10px 25px -6px rgba(15, 23, 42, 0.25)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#93c5fd",
                        }}
                      >
                        Live Public Queue Board Preview
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.65)",
                        }}
                      >
                        How other students see your row
                      </span>
                    </div>
                    <div
                      style={{
                        background: "white",
                        borderRadius: 12,
                        padding: "11px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        color: "var(--slate-800)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--blue-600)",
                          minWidth: 48,
                        }}
                      >
                        {activeTicketNumber || "C-003"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--slate-800)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span>
                            {formatQueueDisplayName(
                              effectivePreviewName,
                              draft.queueDisplayMode
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--blue-600)",
                              background: "var(--blue-50)",
                              border: "1px solid var(--blue-200)",
                              borderRadius: 99,
                              padding: "1px 7px",
                            }}
                          >
                            You
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--slate-400)" }}>
                          9:30 AM
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--slate-400)",
                        }}
                      >
                        #1
                      </span>
                    </div>
                  </div>

                  {/* Public Queue Display Mode Radio Group */}
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--slate-800)",
                        marginBottom: 4,
                      }}
                    >
                      Public Queue Display Mode
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--slate-500)",
                        marginBottom: 12,
                      }}
                    >
                      Choose how your name is displayed under the Cashier Window and Registrar Window live waiting lists.
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {displayModes.map((m) => {
                        const selected = draft.queueDisplayMode === m.value;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => handleFieldChange("queueDisplayMode", m.value)}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              padding: "13px 15px",
                              borderRadius: 14,
                              border: selected
                                ? "2px solid var(--blue-600)"
                                : "1.5px solid var(--slate-200)",
                              background: selected
                                ? "rgba(239, 246, 255, 0.6)"
                                : "white",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "'Outfit', sans-serif",
                              transition: "all 0.16s ease",
                            }}
                          >
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: selected
                                  ? "5px solid var(--blue-600)"
                                  : "2px solid var(--slate-300)",
                                background: "white",
                                marginTop: 2,
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  marginBottom: 3,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "var(--slate-800)",
                                  }}
                                >
                                  {m.title}{" "}
                                  <span
                                    style={{
                                      fontFamily: "'Space Mono', monospace",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "var(--blue-600)",
                                      marginLeft: 4,
                                    }}
                                  >
                                    ({m.preview})
                                  </span>
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: 99,
                                    background: selected
                                      ? "var(--blue-100)"
                                      : "var(--slate-100)",
                                    color: selected
                                      ? "var(--blue-700)"
                                      : "var(--slate-500)",
                                  }}
                                >
                                  {m.badge}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--slate-500)",
                                  lineHeight: 1.45,
                                }}
                              >
                                {m.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Queue Turn Alert Threshold */}
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--slate-800)",
                        marginBottom: 4,
                      }}
                    >
                      Queue Turn Alert Threshold
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--slate-500)",
                        marginBottom: 10,
                      }}
                    >
                      Select when to trigger your browser chime and notification while waiting in line.
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {thresholdOptions.map((opt) => {
                        const selected = draft.alertThreshold === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleFieldChange("alertThreshold", opt.value)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              padding: "11px 14px",
                              borderRadius: 12,
                              border: selected
                                ? "2px solid var(--blue-600)"
                                : "1.5px solid var(--slate-200)",
                              background: selected
                                ? "rgba(239, 246, 255, 0.55)"
                                : "white",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "var(--slate-800)",
                                }}
                              >
                                {opt.title}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--slate-500)",
                                  marginTop: 2,
                                }}
                              >
                                {opt.desc}
                              </div>
                            </div>
                            {selected && (
                              <CheckCircle
                                size={18}
                                weight="fill"
                                color="var(--blue-600)"
                                style={{ flexShrink: 0 }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 3: NOTIFICATIONS & SOUND                             */}
              {/* ══════════════════════════════════════════════════════════ */}
              {activeTab === "notifications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "var(--slate-800)",
                        marginBottom: 4,
                      }}
                    >
                      Notifications & Audio Alerts
                    </div>
                    <div style={{ fontSize: 12, color: "var(--slate-500)" }}>
                      Configure how SASCHED alerts you when your ticket approaches or reaches the window.
                    </div>
                  </div>

                  {/* 1. Live Queue Audio Chime */}
                  <div
                    style={{
                      border: "1.5px solid var(--slate-200)",
                      borderRadius: 16,
                      padding: "16px 18px",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: "var(--blue-50)",
                            color: "var(--blue-600)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <SpeakerHigh size={20} weight="bold" />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--slate-800)",
                            }}
                          >
                            Live Queue Audio Chime
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--slate-500)",
                              lineHeight: 1.5,
                              marginTop: 2,
                            }}
                          >
                            Play a subtle 3-tone ascending chime in your browser when your ticket is called to the Cashier or Registrar window.
                          </div>
                          <button
                            type="button"
                            onClick={onTestChime}
                            style={{
                              marginTop: 10,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "5px 11px",
                              borderRadius: 8,
                              border: "1px solid var(--blue-200)",
                              background: "var(--blue-50)",
                              color: "var(--blue-700)",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            <SpeakerHigh size={13} weight="fill" /> Test Audio Chime
                          </button>
                        </div>
                      </div>

                      {/* Toggle switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.audioChimeEnabled}
                        onClick={() =>
                          handleFieldChange("audioChimeEnabled", !draft.audioChimeEnabled)
                        }
                        style={{
                          width: 46,
                          height: 26,
                          borderRadius: 99,
                          border: "none",
                          background: draft.audioChimeEnabled
                            ? "var(--blue-600)"
                            : "var(--slate-300)",
                          position: "relative",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            left: draft.audioChimeEnabled ? 23 : 3,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
                            transition: "left 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 2. Browser Push Notifications */}
                  <div
                    style={{
                      border: "1.5px solid var(--slate-200)",
                      borderRadius: 16,
                      padding: "16px 18px",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: "rgba(124, 58, 237, 0.1)",
                            color: "#7c3aed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <BellRinging size={20} weight="bold" />
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--slate-800)",
                              }}
                            >
                              Browser Push Notifications
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 99,
                                background:
                                  notifPermission === "granted"
                                    ? "rgba(34, 197, 94, 0.12)"
                                    : notifPermission === "denied"
                                      ? "rgba(239, 68, 68, 0.12)"
                                      : "var(--slate-100)",
                                color:
                                  notifPermission === "granted"
                                    ? "#15803d"
                                    : notifPermission === "denied"
                                      ? "#dc2626"
                                      : "var(--slate-500)",
                              }}
                            >
                              {notifPermission === "granted"
                                ? "Permission Granted"
                                : notifPermission === "denied"
                                  ? "Blocked in Browser"
                                  : "Permission Needed"}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--slate-500)",
                              lineHeight: 1.5,
                              marginTop: 2,
                            }}
                          >
                            Receive desktop or mobile browser banner alerts even if you switch tabs while waiting for your turn.
                          </div>
                          {notifPermission === "denied" && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#dc2626",
                                marginTop: 6,
                                fontWeight: 500,
                              }}
                            >
                              Notifications are currently blocked for this site. Click the lock icon in your browser address bar to allow them.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Toggle switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.browserNotifications}
                        onClick={handleToggleBrowserNotifications}
                        style={{
                          width: 46,
                          height: 26,
                          borderRadius: 99,
                          border: "none",
                          background: draft.browserNotifications
                            ? "var(--blue-600)"
                            : "var(--slate-300)",
                          position: "relative",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            left: draft.browserNotifications ? 23 : 3,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
                            transition: "left 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 3. Email Booking Reminders */}
                  <div
                    style={{
                      border: "1.5px solid var(--slate-200)",
                      borderRadius: 16,
                      padding: "16px 18px",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#059669",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <EnvelopeSimple size={20} weight="bold" />
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--slate-800)",
                              }}
                            >
                              Email Booking Reminders
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 99,
                                background: "var(--blue-50)",
                                color: "var(--blue-700)",
                              }}
                            >
                              {userEmail}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--slate-500)",
                              lineHeight: 1.5,
                              marginTop: 2,
                            }}
                          >
                            Email reminders for upcoming appointments and booking confirmations.
                          </div>
                        </div>
                      </div>

                      {/* Toggle switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.emailNotifications}
                        onClick={() =>
                          handleFieldChange(
                            "emailNotifications",
                            !draft.emailNotifications
                          )
                        }
                        style={{
                          width: 46,
                          height: 26,
                          borderRadius: 99,
                          border: "none",
                          background: draft.emailNotifications
                            ? "var(--blue-600)"
                            : "var(--slate-300)",
                          position: "relative",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            left: draft.emailNotifications ? 23 : 3,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
                            transition: "left 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 4: SECURITY & DISPLAY                                */}
              {/* ══════════════════════════════════════════════════════════ */}
              {activeTab === "security" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Display & Performance Section */}
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--slate-800)",
                        marginBottom: 8,
                      }}
                    >
                      Appearance & Motion
                    </div>

                    {/* Theme Preference Selector (Light Active + Dark Coming Soon) */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 13,
                          border: "2px solid var(--blue-600)",
                          background: "rgba(239, 246, 255, 0.55)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Sun size={18} weight="fill" color="var(--blue-600)" />
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--slate-800)",
                              }}
                            >
                              Light Mode
                            </div>
                            <div style={{ fontSize: 11, color: "var(--slate-500)" }}>
                              Frost & Pastel Azure
                            </div>
                          </div>
                        </div>
                        <CheckCircle size={18} weight="fill" color="var(--blue-600)" />
                      </div>

                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 13,
                          border: "1.5px solid var(--slate-200)",
                          background: "var(--slate-50)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          opacity: 0.75,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Moon size={18} weight="bold" color="var(--slate-500)" />
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--slate-700)",
                              }}
                            >
                              Dark Mode
                            </div>
                            <div style={{ fontSize: 11, color: "var(--slate-400)" }}>
                              Midnight Navy Theme
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "var(--slate-200)",
                            color: "var(--slate-600)",
                          }}
                        >
                          Coming Soon
                        </span>
                      </div>
                    </div>

                    {/* Reduce Motion Toggle */}
                    <div
                      style={{
                        border: "1.5px solid var(--slate-200)",
                        borderRadius: 14,
                        padding: "14px 16px",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "var(--slate-100)",
                            color: "var(--slate-700)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <LightningSlash size={18} weight="bold" />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--slate-800)",
                            }}
                          >
                            Reduce Motion (Pause Background Animation)
                          </div>
                          <div style={{ fontSize: 11, color: "var(--slate-500)" }}>
                            Disables the 3D WebGL wave canvas and floating particles to save battery on laptops and mobile devices.
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.reduceMotion}
                        onClick={() =>
                          handleFieldChange("reduceMotion", !draft.reduceMotion)
                        }
                        style={{
                          width: 46,
                          height: 26,
                          borderRadius: 99,
                          border: "none",
                          background: draft.reduceMotion
                            ? "var(--blue-600)"
                            : "var(--slate-300)",
                          position: "relative",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            left: draft.reduceMotion ? 23 : 3,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
                            transition: "left 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <div
                    style={{
                      border: "1.5px solid var(--slate-200)",
                      borderRadius: 16,
                      padding: "16px 18px",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--slate-800)",
                        marginBottom: 4,
                      }}
                    >
                      <Key size={16} weight="bold" color="var(--blue-600)" />
                      Update Account Password
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--slate-500)",
                        marginBottom: 14,
                      }}
                    >
                      Verify your current password to set a new login password.
                    </div>

                    {pwError && (
                      <div
                        style={{
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontSize: 12,
                          color: "#dc2626",
                          fontWeight: 600,
                          marginBottom: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <WarningCircle size={15} weight="fill" />
                        <span>{pwError}</span>
                      </div>
                    )}

                    {pwSuccess && (
                      <div
                        style={{
                          background: "rgba(34, 197, 94, 0.1)",
                          border: "1px solid rgba(34, 197, 94, 0.3)",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontSize: 12,
                          color: "#15803d",
                          fontWeight: 600,
                          marginBottom: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CheckCircle size={15} weight="fill" />
                        <span>{pwSuccess}</span>
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          placeholder="Current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "9px 34px 9px 12px",
                            borderRadius: 10,
                            border: "1.5px solid var(--slate-200)",
                            fontSize: 12,
                            fontFamily: "'Outfit', sans-serif",
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw((v) => !v)}
                          style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            background: "transparent",
                            color: "var(--slate-400)",
                            cursor: "pointer",
                            display: "flex",
                          }}
                        >
                          {showCurrentPw ? <EyeSlash size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      <div style={{ position: "relative" }}>
                        <input
                          type={showNewPw ? "text" : "password"}
                          placeholder="New password (6+ chars)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "9px 34px 9px 12px",
                            borderRadius: 10,
                            border: "1.5px solid var(--slate-200)",
                            fontSize: 12,
                            fontFamily: "'Outfit', sans-serif",
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw((v) => !v)}
                          style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            background: "transparent",
                            color: "var(--slate-400)",
                            cursor: "pointer",
                            display: "flex",
                          }}
                        >
                          {showNewPw ? <EyeSlash size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      <div>
                        <input
                          type={showNewPw ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 10,
                            border: "1.5px solid var(--slate-200)",
                            fontSize: 12,
                            fontFamily: "'Outfit', sans-serif",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        disabled={pwLoading}
                        onClick={handlePasswordChange}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: "var(--slate-800)",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: pwLoading ? "not-allowed" : "pointer",
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        {pwLoading ? "Updating Password…" : "Update Password"}
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions Management */}
                  <div
                    style={{
                      border: "1.5px solid var(--slate-200)",
                      borderRadius: 16,
                      padding: "16px 18px",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--slate-800)",
                        }}
                      >
                        Session Management
                      </div>
                      <div style={{ fontSize: 12, color: "var(--slate-500)", marginTop: 2 }}>
                        Signed in as <strong>{userEmail}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={sessionActionLoading}
                        onClick={() => handleSignOutScope("others")}
                        style={{
                          padding: "8px 13px",
                          borderRadius: 10,
                          border: "1px solid var(--slate-200)",
                          background: "var(--slate-50)",
                          color: "var(--slate-700)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        Sign Out Other Devices
                      </button>
                      <button
                        type="button"
                        disabled={sessionActionLoading}
                        onClick={() => handleSignOutScope("global")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 13px",
                          borderRadius: 10,
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          background: "rgba(239, 68, 68, 0.08)",
                          color: "#dc2626",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        <SignOut size={14} weight="bold" /> Sign Out Everywhere
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── MODAL FOOTER ──────────────────────────────────────────── */}
          <div
            style={{
              padding: "16px 26px",
              borderTop: "1px solid var(--slate-200)",
              background: "var(--slate-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--slate-500)" }}>
              {hasUnsavedChanges ? (
                <span style={{ color: "var(--blue-600)", fontWeight: 600 }}>
                  ● You have unsaved changes
                </span>
              ) : (
                <span>All preferences up to date</span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                style={{
                  padding: "10px 18px",
                  borderRadius: 11,
                  border: "1.5px solid var(--slate-200)",
                  background: "white",
                  color: "var(--slate-600)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSubmit}
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 22px",
                  borderRadius: 11,
                  border: "none",
                  background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                }}
              >
                <Check size={15} weight="bold" />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
