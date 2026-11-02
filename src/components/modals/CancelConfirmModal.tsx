import { WarningCircle } from "@phosphor-icons/react";
import type { AppTicket } from "../../types/booking";

export interface CancelConfirmModalProps {
  isOpen: boolean;
  ticket: AppTicket | null;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export default function CancelConfirmModal({
  isOpen,
  ticket,
  onClose,
  onConfirmCancel,
}: CancelConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9997,
        background: "rgba(15,23,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 22,
          padding: "36px 32px",
          maxWidth: 380,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.08)",
            border: "1.5px solid rgba(239,68,68,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <WarningCircle size={28} color="#ef4444" />
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 20,
            color: "var(--slate-800)",
            marginBottom: 10,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Cancel Appointment?
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--slate-500)",
            lineHeight: 1.65,
            marginBottom: 26,
          }}
        >
          Are you sure you want to cancel ticket{" "}
          <strong style={{ color: "var(--slate-700)" }}>
            {ticket?.number}
          </strong>
          ? This action cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 11,
              border: "1.5px solid var(--slate-200)",
              background: "var(--surface)",
              color: "var(--slate-600)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Keep It
          </button>
          <button
            onClick={onConfirmCancel}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 11,
              border: "none",
              background: "#ef4444",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

