import { useState } from "react";
import type React from "react";
import {
  CheckCircle,
  Sparkle,
  Ticket,
  Check,
  Copy,
  MapPin,
  CalendarBlank,
  Users,
  WarningCircle,
  SpeakerHigh,
  DownloadSimple,
  ShareNetwork,
} from "@phosphor-icons/react";
import { SCHOOL_NAME, DEPT, VENUE, type AppTicket } from "../../types/booking";
import { isTicketToday } from "../../utils/dateAndSlots";

export interface TicketViewProps {
  ticket: AppTicket;
  studentId: string;
  programSection: string;
  hasActiveTicket: boolean;
  ticketVisible: boolean;
  ticketNumCopied: boolean;
  qrCodeUrl: string;
  queuePosition: number | null;
  testingChime: boolean;
  setShowCancelConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  handleCopyTicketNumber: (num: string) => void;
  handleTestChime: () => void;
  handleSave: () => void;
  reset: () => void;
}

export default function TicketView({
  ticket,
  studentId,
  programSection,
  hasActiveTicket,
  ticketVisible,
  ticketNumCopied,
  qrCodeUrl,
  queuePosition,
  testingChime,
  setShowCancelConfirm,
  handleCopyTicketNumber,
  handleTestChime,
  handleSave,
  reset,
}: TicketViewProps) {
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const trimmedStudentId = studentId.trim();
  const trimmedProgramSection = programSection.trim();

  // ── Share ticket details (Web Share API → clipboard fallback) ────
  const handleShare = async () => {
    if (!ticket) return;
    const text = [
      `SASCHED Appointment Ticket`,
      `Ticket #: ${ticket.number}`,
      `Name: ${ticket.name}`,
      ...(trimmedStudentId ? [`Student ID: ${trimmedStudentId}`] : []),
      ...(trimmedProgramSection ? [`Program / Section: ${trimmedProgramSection}`] : []),
      `Date: ${ticket.date}`,
      `Time: ${ticket.time}`,
      `Window: ${ticket.window}`,
      `Venue: ${ticket.venue}`,
    ].join("\n");
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `SASCHED Ticket ${ticket.number}`, text });
      } catch (_) {
        /* user cancelled share dialog */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2200);
      } catch (_) {
        if (import.meta.env.DEV) console.warn("[DEV] Clipboard write failed");
      }
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
      }}
    >
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--green-500)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
          }}
        >
          <CheckCircle size={28} color="white" />
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 20,
            color: "var(--slate-800)",
            letterSpacing: "-0.02em",
          }}
        >
          {hasActiveTicket && !ticketVisible
            ? "Active Appointment"
            : "Booking Confirmed!"}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--slate-500)",
            marginTop: 4,
          }}
        >
          {hasActiveTicket && !ticketVisible
            ? "You have a live queue ticket. Wait for your turn."
            : "Your appointment has been successfully registered."}
        </div>
      </div>

      {(ticketVisible || hasActiveTicket) && (
        <div
          className="ticket-appear ticket-shadow ticket-print-area"
          style={{
            width: "100%",
            maxWidth: 450,
            background: "white",
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background:
                ticket.window?.toLowerCase().includes("registrar") || ticket.department === "Registrar"
                  ? "linear-gradient(135deg, #312e81 0%, #4338ca 55%, #6366f1 100%)"
                  : "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)",
              padding: "24px 26px 20px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
              }}
            />
            
            {/* Top subheader row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Sparkle size={12} weight="fill" color="#fbbf24" />
                <span>OFFICIAL APPOINTMENT TICKET</span>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.16)",
                  borderRadius: 99,
                  padding: "4px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  backdropFilter: "blur(6px)",
                }}
              >
                <Ticket size={13} color="white" weight="duotone" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
                  {ticket.window?.includes("Registrar") || ticket.department === "Registrar" ? "REGISTRAR" : "CASHIER"}
                </span>
              </div>
            </div>

            {/* Hero Ticket Number & Copy Pill Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background: "rgba(0, 0, 0, 0.16)",
                padding: "10px 16px",
                borderRadius: 14,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 34,
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1,
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {ticket.number}
              </div>
              <button
                type="button"
                onClick={() => handleCopyTicketNumber(ticket.number)}
                title="Copy ticket number"
                className="no-print"
                style={{
                  background: ticketNumCopied ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.18s ease",
                  flexShrink: 0,
                }}
              >
                {ticketNumCopied ? (
                  <>
                    <Check size={12} weight="bold" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>

            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
                marginTop: 10,
                fontWeight: 500,
              }}
            >
              {SCHOOL_NAME} · {DEPT}
            </div>
          </div>

          {/* Tear line with authentic notches */}
          <div className="ticket-perforation-divider">
            <div className="ticket-notch-l" />
            <div className="ticket-notch-r" />
            <div className="ticket-perforation-line" />
          </div>
          <div style={{ padding: "24px 26px 22px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 18,
              }}
            >
              {[
                { label: "Name", value: ticket.name, fullWidth: false },
                trimmedStudentId
                  ? {
                      label: "Student ID",
                      value: trimmedStudentId,
                      mono: true,
                      isId: false,
                      fullWidth: false,
                    }
                  : {
                      label: "Account ID",
                      value: ticket.id,
                      mono: true,
                      isId: true,
                      fullWidth: false,
                    },
                ...(trimmedProgramSection
                  ? [
                      {
                        label: "Program / Section",
                        value: trimmedProgramSection,
                        mono: false,
                        isId: false,
                        fullWidth: true,
                      },
                    ]
                  : []),
                { label: "Date", value: ticket.date, fullWidth: false },
                { label: "Time", value: ticket.time, fullWidth: false },
                { label: "Purpose", value: ticket.service_type, fullWidth: false },
                { label: "Window", value: ticket.window, fullWidth: false },
              ].map((field) => (
                <div
                  key={field.label}
                  style={{
                    minWidth: 0,
                    gridColumn: field.fullWidth ? "1 / -1" : undefined,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--slate-400)",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      marginBottom: 3,
                    }}
                  >
                    {field.label.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--slate-800)",
                      fontFamily: field.mono
                        ? "'Space Mono', monospace"
                        : "inherit",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={field.value}
                  >
                    {field.isId && field.value && field.value.length > 12
                      ? `${field.value.slice(0, 8)}...${field.value.slice(-4)}`
                      : field.value}
                  </div>
                </div>
              ))}
            </div>
            {/* Venue */}
            <div
              style={{
                background: "var(--slate-50)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid var(--slate-200)",
              }}
            >
              <MapPin size={13} color="var(--slate-500)" />
              <div
                style={{
                  fontSize: 12,
                  color: "var(--slate-600)",
                  fontWeight: 500,
                }}
              >
                {VENUE}
              </div>
            </div>

            {/* Scannable QR Code */}
            {qrCodeUrl && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 12px 14px",
                  background: "var(--slate-50)",
                  borderRadius: 14,
                  border: "1px dashed var(--slate-300)",
                  marginBottom: 16,
                }}
              >
                <img
                  src={qrCodeUrl}
                  alt={`QR code for ticket ${ticket.number}`}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 8,
                    background: "white",
                    padding: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--slate-500)",
                    letterSpacing: "0.06em",
                    marginTop: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Scan at Window Kiosk
                </div>
              </div>
            )}

            {/* Queue position / Scheduled Notice */}
            {(() => {
              const isFuture = !isTicketToday(ticket);
              return (
                <div
                  style={{
                    background: isFuture ? "var(--slate-50)" : "var(--blue-50)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 20,
                    border: isFuture
                      ? "1px solid var(--slate-200)"
                      : "1px solid var(--blue-100)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isFuture ? (
                      <CalendarBlank size={14} color="var(--slate-600)" />
                    ) : (
                      <Users size={14} color="var(--blue-600)" />
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        color: isFuture ? "var(--slate-700)" : "var(--blue-700)",
                        fontWeight: 500,
                      }}
                    >
                      {isFuture ? (
                        <>
                          Appointment scheduled for <strong>{ticket.date}</strong> at{" "}
                          <strong>{ticket.time}</strong>. Please arrive 10 minutes prior to
                          your time slot. Live queue positioning will activate on that day.
                        </>
                      ) : queuePosition === null ? (
                        <>
                          Your ticket is <strong>{ticket.number}</strong>. Please arrive 10
                          minutes before your slot.
                        </>
                      ) : queuePosition === 0 ? (
                        <>
                          <strong>You are next!</strong> Please proceed to your window
                          immediately.
                        </>
                      ) : (
                        <>
                          You are <strong>#{queuePosition}</strong> in the live queue for{" "}
                          {ticket.window}. Stay nearby and watch for your turn.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div
              style={{
                fontSize: 10,
                color: "var(--slate-400)",
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              Issued: {ticket.issued}
            </div>
            {/* Cancel Appointment — Feature 1 */}
            <button
              className="no-print"
              onClick={() => setShowCancelConfirm(true)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                border: "1.5px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.04)",
                color: "#ef4444",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "'Outfit', sans-serif",
                marginBottom: 8,
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.10)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.04)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
              }}
            >
              <WarningCircle size={13} /> Cancel Appointment
            </button>
            {/* Save / Share / Return / Test Chime */}
            <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={handleTestChime}
                disabled={testingChime}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "1.5px solid var(--blue-200)",
                  background: testingChime ? "var(--blue-50)" : "white",
                  color: "var(--blue-700)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: testingChime ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.18s ease",
                }}
              >
                <SpeakerHigh size={14} weight={testingChime ? "fill" : "bold"} />
                {testingChime ? "Chime Playing…" : "Test Chime"}
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "1.5px solid var(--slate-200)",
                  background: "white",
                  color: "var(--slate-600)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <DownloadSimple size={14} /> Save
              </button>
              <button
                onClick={handleShare}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "1.5px solid var(--slate-200)",
                  background: shareCopied ? "var(--green-500)" : "white",
                  color: shareCopied ? "white" : "var(--slate-600)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.25s ease",
                }}
              >
                <ShareNetwork size={14} />
                {shareCopied ? "Copied!" : "Share"}
              </button>
            </div>
            <button
              className="btn-primary no-print"
              onClick={reset}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 11,
                border: "none",
                background: "var(--blue-600)",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Return to Portal Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
