import { CheckCircle } from "@phosphor-icons/react";

export interface SessionEndedModalProps {
  sessionEndedStatus: string | null;
  onDismiss: () => void;
}

export default function SessionEndedModal({
  sessionEndedStatus,
  onDismiss,
}: SessionEndedModalProps) {
  if (!sessionEndedStatus) return null;

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
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 24,
          padding: "40px 36px",
          maxWidth: 400,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--slate-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle size={32} color="var(--slate-400)" />
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 22,
            color: "var(--slate-800)",
            letterSpacing: "-0.02em",
            marginBottom: 8,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Session Concluded
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--slate-500)",
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          Your appointment session has ended.
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--slate-50)",
            border: "1px solid var(--slate-200)",
            borderRadius: 99,
            padding: "5px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--slate-600)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 28,
          }}
        >
          Status: {sessionEndedStatus}
        </div>
        <button
          onClick={onDismiss}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 13,
            border: "none",
            background: "var(--blue-600)",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

