import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  ShieldCheck,
  CaretDown,
  GearSix,
  Eye,
  ClockCounterClockwise,
  SignOut,
} from "@phosphor-icons/react";
import { SCHOOL_NAME, DEPT, type CurrentUser } from "../types/booking";
import type { SettingsTab, UserSettings } from "../settings/types";

export interface HeaderProps {
  currentUser: CurrentUser;
  settings: Pick<
    UserSettings,
    "queueDisplayMode" | "studentId" | "programSection"
  >;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenHistory: () => void;
  onLogout: () => void;
}

export default function Header({
  currentUser,
  settings,
  onOpenSettings,
  onOpenHistory,
  onLogout,
}: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click or Escape
  useEffect(() => {
    if (!showUserDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowUserDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [showUserDropdown]);

  const openSettingsAtTab = (tab: SettingsTab = "profile") => {
    setShowUserDropdown(false);
    onOpenSettings(tab);
  };

  return (
    <header
      style={{
        background: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.75)",
        boxShadow:
          "0 4px 24px -1px rgba(15, 23, 42, 0.05), inset 0 -1px 0 0 rgba(226, 232, 240, 0.6)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 20px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Custom Logo Image */}
          <img
            src="/logo.png"
            alt="SASCHED Logo"
            style={{
              width: 42,
              height: 42,
              objectFit: "contain",
              borderRadius: 10,
            }}
          />
          {/* Text matching your screenshot */}
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: "var(--slate-800)",
                letterSpacing: "-0.01em",
              }}
            >
              {SCHOOL_NAME}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--slate-400)",
                fontWeight: 500,
                marginTop: -2,
              }}
            >
              {DEPT}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Interactive Account ID pill + User Dropdown Menu */}
          <div ref={userDropdownRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowUserDropdown((prev) => !prev)}
              title="Account & Settings"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: showUserDropdown
                  ? "rgba(219, 234, 254, 0.9)"
                  : "rgba(239, 246, 255, 0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: showUserDropdown
                  ? "1px solid var(--blue-400)"
                  : "1px solid rgba(191, 219, 254, 0.8)",
                borderRadius: 99,
                padding: "5px 12px",
                boxShadow: showUserDropdown
                  ? "0 4px 12px rgba(37, 99, 235, 0.12)"
                  : "0 1px 3px rgba(0, 0, 0, 0.02)",
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                transition: "all 0.18s ease",
              }}
            >
              <UserCheck size={13} color="var(--blue-600)" />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--blue-700)",
                  fontWeight: 600,
                }}
              >
                {currentUser.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--blue-400)" }}>
                · {currentUser.email}
              </span>
              {settings.queueDisplayMode !== "full_name" && (
                <span
                  title={`Public Queue Privacy: ${
                    settings.queueDisplayMode === "initials"
                      ? "Initials & Last Name"
                      : "Ticket Only (Anonymous)"
                  }`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#1d4ed8",
                    background: "rgba(37, 99, 235, 0.12)",
                    borderRadius: 99,
                    padding: "1px 6px",
                  }}
                >
                  <ShieldCheck size={11} weight="fill" />
                  {settings.queueDisplayMode === "initials" ? "Initials" : "Anon"}
                </span>
              )}
              <CaretDown
                size={11}
                weight="bold"
                color="var(--blue-600)"
                style={{
                  transform: showUserDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.18s ease",
                }}
              />
            </button>

            <AnimatePresence>
              {showUserDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 270,
                    background: "rgba(255, 255, 255, 0.96)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(226, 232, 240, 0.95)",
                    borderRadius: 16,
                    boxShadow:
                      "0 18px 38px -10px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.06)",
                    padding: 8,
                    zIndex: 120,
                  }}
                >
                  {/* User identity summary header */}
                  <div
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--slate-100)",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--slate-800)",
                        lineHeight: 1.25,
                      }}
                    >
                      {currentUser.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--slate-400)",
                        marginTop: 2,
                        wordBreak: "break-all",
                      }}
                    >
                      {currentUser.email}
                    </div>
                    {(settings.studentId || settings.programSection) && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 5,
                          marginTop: 7,
                        }}
                      >
                        {settings.studentId && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--blue-700)",
                              background: "var(--blue-50)",
                              border: "1px solid var(--blue-200)",
                              borderRadius: 6,
                              padding: "2px 6px",
                              fontFamily: "'Space Mono', monospace",
                            }}
                          >
                            ID: {settings.studentId}
                          </span>
                        )}
                        {settings.programSection && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--slate-600)",
                              background: "var(--slate-100)",
                              borderRadius: 6,
                              padding: "2px 6px",
                            }}
                          >
                            {settings.programSection}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dropdown items */}
                  {[
                    {
                      label: "Profile & Settings",
                      sub: "Student ID, course & preferences",
                      icon: <GearSix size={15} color="var(--blue-600)" weight="duotone" />,
                      onClick: () => openSettingsAtTab("profile"),
                    },
                    {
                      label: "Queue & Privacy",
                      sub:
                        settings.queueDisplayMode === "full_name"
                          ? "Showing Full Name"
                          : settings.queueDisplayMode === "initials"
                            ? "Showing Initials Only"
                            : "Showing Ticket Code Only",
                      icon: <Eye size={15} color="#7c3aed" weight="duotone" />,
                      onClick: () => openSettingsAtTab("privacy"),
                    },
                    {
                      label: "My History",
                      sub: "Past appointments & tickets",
                      icon: (
                        <ClockCounterClockwise
                          size={15}
                          color="var(--slate-600)"
                          weight="duotone"
                        />
                      ),
                      onClick: () => {
                        setShowUserDropdown(false);
                        onOpenHistory();
                      },
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "'Outfit', sans-serif",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--slate-100)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: "var(--slate-50)",
                          border: "1px solid var(--slate-200)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--slate-800)",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--slate-400)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.sub}
                        </div>
                      </div>
                    </button>
                  ))}

                  <div
                    style={{
                      height: 1,
                      background: "var(--slate-100)",
                      margin: "6px 4px",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowLogoutConfirm(true);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "none",
                      background: "transparent",
                      color: "#dc2626",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <SignOut size={15} color="#dc2626" weight="bold" />
                    <span>Log Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings pill button */}
          <button
            type="button"
            onClick={() => openSettingsAtTab("profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(226, 232, 240, 0.85)",
              borderRadius: 99,
              padding: "5px 12px",
              fontSize: 12,
              color: "var(--slate-600)",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              transition: "all 0.18s ease",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--blue-300)";
              e.currentTarget.style.color = "var(--blue-600)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.85)";
              e.currentTarget.style.color = "var(--slate-600)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.65)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.02)";
            }}
          >
            <GearSix size={13} weight="bold" />
            <span>Settings</span>
          </button>

          {/* My History button */}
          <button
            onClick={() => {
              setShowUserDropdown(false);
              onOpenHistory();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(226, 232, 240, 0.85)",
              borderRadius: 99,
              padding: "5px 12px",
              fontSize: 12,
              color: "var(--slate-600)",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              transition: "all 0.18s ease",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--blue-300)";
              e.currentTarget.style.color = "var(--blue-600)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.85)";
              e.currentTarget.style.color = "var(--slate-600)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.65)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.02)";
            }}
          >
            <ClockCounterClockwise size={13} weight="bold" />
            <span>My History</span>
          </button>

          {/* Log Out — two-step confirmation (Feature 3) */}
          {showLogoutConfirm ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--slate-600)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Log out?
              </span>
              <button
                onClick={onLogout}
                style={{
                  padding: "5px 14px",
                  borderRadius: 99,
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 99,
                  border: "1px solid var(--slate-200)",
                  background: "white",
                  color: "var(--slate-600)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn-logout"
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(226, 232, 240, 0.85)",
                borderRadius: 99,
                padding: "5px 12px",
                fontSize: 12,
                color: "var(--slate-500)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              <SignOut size={13} weight="bold" />
              Log Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
