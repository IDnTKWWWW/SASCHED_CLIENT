import {
  ClockCounterClockwise,
  X,
  Ticket,
  Copy,
  CheckCircle,
  Lightning,
  Clock,
  WarningCircle,
} from "@phosphor-icons/react";
import type { CurrentUser } from "../../types/booking";

export interface HistoryModalProps {
  isOpen: boolean;
  currentUser: CurrentUser;
  historyLoading: boolean;
  historyList: any[];
  onClose: () => void;
  onCopyTicketNumber: (num: string) => void;
}

export default function HistoryModal({
  isOpen,
  currentUser,
  historyLoading,
  historyList,
  onClose,
  onCopyTicketNumber,
}: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9996,
        background: "rgba(15,23,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 22,
          padding: "28px 26px",
          maxWidth: 520,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
            paddingBottom: 14,
            borderBottom: "1px solid var(--slate-100)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--blue-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClockCounterClockwise size={18} color="var(--blue-600)" weight="bold" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: "var(--slate-800)",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                My Appointment History
              </div>
              <div style={{ fontSize: 12, color: "var(--slate-400)" }}>
                Records for account: {currentUser.name}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
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
        </div>

        {/* List Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 4,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {historyLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--slate-400)",
                fontSize: 13,
              }}
            >
              Loading past records…
            </div>
          ) : historyList.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: "var(--slate-400)",
              }}
            >
              <Ticket size={36} color="var(--slate-300)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--slate-600)" }}>
                No past records found
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Appointments you create or complete will appear here.
              </div>
            </div>
          ) : (
            historyList.map((item) => {
              const statusColor =
                item.status === "served"
                  ? { bg: "#dcfce7", text: "#15803d", label: "Completed" }
                  : item.status === "serving"
                  ? { bg: "#fef3c7", text: "#b45309", label: "Serving" }
                  : item.status === "waiting"
                  ? { bg: "#dbeafe", text: "#1d4ed8", label: "In Queue" }
                  : item.status === "noshow"
                  ? { bg: "#fee2e2", text: "#b91c1c", label: "No-show" }
                  : { bg: "#f1f5f9", text: "#475569", label: item.status || "Removed" };

              const dateDisplay = item.appointment_time?.includes("T")
                ? item.appointment_time.replace("T", " · ")
                : item.appointment_time;

              return (
                <div
                  key={item.id || item.ticket_number}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1px solid var(--slate-200)",
                    background: "var(--slate-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--slate-800)",
                        }}
                      >
                        {item.ticket_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => onCopyTicketNumber(item.ticket_number)}
                        title="Copy ticket number"
                        style={{
                          background: "white",
                          border: "1px solid var(--slate-200)",
                          borderRadius: 6,
                          padding: "2px 6px",
                          color: "var(--slate-500)",
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        <Copy size={11} /> Copy
                      </button>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: item.department === "Registrar" ? "#f3e8ff" : "#eff6ff",
                          color: item.department === "Registrar" ? "#7e22ce" : "#1d4ed8",
                        }}
                      >
                        {item.department || "General"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--slate-600)", marginTop: 4 }}>
                      {item.service_type || "Appointment"} · {dateDisplay || "Walk-in"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--slate-400)", marginTop: 2 }}>
                      Created: {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 99,
                      background: statusColor.bg,
                      color: statusColor.text,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      textTransform: "capitalize",
                    }}
                  >
                    {item.status === "served" && <CheckCircle size={12} weight="bold" />}
                    {item.status === "serving" && <Lightning size={12} weight="bold" />}
                    {item.status === "waiting" && <Clock size={12} weight="bold" />}
                    {item.status === "noshow" && <WarningCircle size={12} weight="bold" />}
                    {item.status === "removed" && <X size={12} weight="bold" />}
                    <span>{statusColor.label}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

