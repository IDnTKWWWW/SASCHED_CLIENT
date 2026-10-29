import { useState } from "react";
import type React from "react";
import { X, Key, WarningCircle, CheckCircle } from "@phosphor-icons/react";
import { supabase } from "../../supabaseClient";

export interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
}

export default function PasswordResetModal({
  isOpen,
  onClose,
  onSuccessToast,
}: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [resetPwLoading, setResetPwLoading] = useState<boolean>(false);
  const [resetPwError, setResetPwError] = useState<string | null>(null);
  const [resetPwSuccess, setResetPwSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setResetPwError(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetPwError("Passwords do not match.");
      return;
    }
    setResetPwLoading(true);
    setResetPwError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setResetPwLoading(false);
    if (error) {
      setResetPwError(error.message);
    } else {
      setResetPwSuccess(true);
      setTimeout(() => {
        onClose();
        setResetPwSuccess(false);
        setNewPassword("");
        setConfirmPassword("");
        onSuccessToast("Password updated successfully!");
      }, 1800);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(15,23,42,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "white",
          borderRadius: 24,
          padding: "36px 32px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid var(--slate-200)",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--slate-500)",
          }}
        >
          <X size={16} />
        </button>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "var(--blue-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Key size={26} color="var(--blue-600)" weight="bold" />
        </div>
        <div
          style={{
            textAlign: "center",
            fontWeight: 800,
            fontSize: 20,
            color: "var(--slate-800)",
            fontFamily: "'Outfit', sans-serif",
            marginBottom: 6,
          }}
        >
          Set New Password
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--slate-500)",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Enter a secure new password for your student account.
        </div>

        {resetPwError && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              color: "#dc2626",
              fontWeight: 500,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <WarningCircle size={15} color="#dc2626" weight="bold" />
              <span>{resetPwError}</span>
            </div>
          </div>
        )}

        {resetPwSuccess && (
          <div
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              color: "#15803d",
              fontWeight: 600,
              marginBottom: 14,
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CheckCircle size={15} color="#15803d" weight="bold" />
              <span>Password updated successfully!</span>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--slate-600)", textTransform: "uppercase" }}>
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 13px",
                borderRadius: 10,
                border: "1.5px solid var(--slate-200)",
                fontSize: 13,
                marginTop: 4,
                outline: "none",
                fontFamily: "'Outfit', sans-serif",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--slate-600)", textTransform: "uppercase" }}>
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 13px",
                borderRadius: 10,
                border: "1.5px solid var(--slate-200)",
                fontSize: 13,
                marginTop: 4,
                outline: "none",
                fontFamily: "'Outfit', sans-serif",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: "12px",
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
              type="submit"
              disabled={resetPwLoading || resetPwSuccess}
              className="btn-primary"
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: 11,
                border: "none",
                background: "var(--blue-600)",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: resetPwLoading ? "not-allowed" : "pointer",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {resetPwLoading ? "Updating…" : "Save New Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
