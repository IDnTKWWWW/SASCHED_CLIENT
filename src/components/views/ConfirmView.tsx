import type React from "react";
import {
  Lock,
  Sparkle,
  Lightning,
  Users,
  Receipt,
  CheckCircle,
  WarningCircle,
  CaretLeft,
  Ticket,
  CalendarBlank,
  Clock,
  IdentificationCard,
  CreditCard,
  MapPin,
  GearSix,
} from "@phosphor-icons/react";
import type { SettingsTab } from "../../settings/types";
import {
  WINDOWS,
  VENUE,
  MONTHS,
  type BookingStep,
  type CurrentUser,
  type PurposeOfVisit,
  type QueueItem,
  type SelectedDate,
  type SelectedSlot,
} from "../../types/booking";

export interface ConfirmViewProps {
  currentUser: CurrentUser;
  studentId: string;
  programSection: string;
  onOpenSettings: (tab?: SettingsTab) => void;
  purposeOfVisit: PurposeOfVisit;
  setPurposeOfVisit: React.Dispatch<React.SetStateAction<PurposeOfVisit>>;
  bookingError: string | null;
  bookingLoading: boolean;
  setStep: React.Dispatch<React.SetStateAction<BookingStep>>;
  handleBook: () => void;
  selectedDate: SelectedDate | null;
  selectedSlot: SelectedSlot | null;
  selectedWindow: string | null;
  cashierQueue: QueueItem[];
  registrarQueue: QueueItem[];
}

export default function ConfirmView({
  currentUser,
  studentId,
  programSection,
  onOpenSettings,
  purposeOfVisit,
  setPurposeOfVisit,
  bookingError,
  bookingLoading,
  setStep,
  handleBook,
  selectedDate,
  selectedSlot,
  selectedWindow,
  cashierQueue,
  registrarQueue,
}: ConfirmViewProps) {
  const hasStudentId = Boolean(studentId.trim());
  const hasProgramSection = Boolean(programSection.trim());
  const identityFields = [
    ...(hasStudentId
      ? [{ label: "Student ID", value: studentId.trim(), mono: true }]
      : []),
    ...(hasProgramSection
      ? [{ label: "Program & Section", value: programSection.trim(), mono: false }]
      : []),
    { label: "Account ID", value: currentUser.accountId, mono: true },
    { label: "Email", value: currentUser.email, mono: false },
  ];
  return (
    <div
      className="slide-up confirm-layout-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 20,
      }}
    >
      <div
        className="card-shadow"
        style={{
          background: "white",
          borderRadius: 18,
          border: "1px solid rgba(226,232,240,0.6)",
          padding: "28px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "var(--slate-800)",
            marginBottom: 4,
          }}
        >
          Confirm Your Appointment
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--slate-400)",
            marginBottom: 24,
          }}
        >
          Review your details before finalizing
        </div>
        {/* Read-only user card */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0f4ff, #e8f0fe)",
            border: "1px solid var(--blue-100)",
            borderRadius: 14,
            padding: "20px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
                  color: "white",
                }}
              >
                {currentUser.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "var(--slate-800)",
                  letterSpacing: "-0.01em",
                }}
              >
                {currentUser.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--slate-500)",
                  marginTop: 2,
                }}
              >
                {purposeOfVisit}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "white",
                border: "1px solid var(--blue-200)",
                borderRadius: 99,
                padding: "4px 10px",
                fontSize: 11,
                color: "var(--blue-600)",
                fontWeight: 600,
              }}
            >
              <Lock size={10} /> Read-only
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {identityFields.map((f) => (
              <div
                key={f.label}
                style={{
                  background: "white",
                  borderRadius: 10,
                  padding: "10px 12px",
                  border: "1px solid var(--blue-100)",
                  minWidth: 0,
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
                  {f.label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--slate-700)",
                    fontFamily: f.mono ? "'Space Mono',monospace" : "inherit",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={f.value}
                >
                  {f.value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--slate-400)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Lock size={10} /> This information is tied to your account and
              cannot be changed here.
            </div>
            {(!hasStudentId || !hasProgramSection) && (
              <button
                type="button"
                onClick={() => onOpenSettings("profile")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 99,
                  border: "1px solid var(--blue-200)",
                  background: "white",
                  color: "var(--blue-600)",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <GearSix size={12} weight="bold" />
                Add Student ID / Section in Settings
              </button>
            )}
          </div>
        </div>

        {/* Purpose of Visit — editable per booking */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "var(--slate-700)",
              marginBottom: 4,
            }}
          >
            Purpose of Visit
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--slate-400)",
              marginBottom: 12,
            }}
          >
            Select the nature of your appointment
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {(
              [
                { id: "General", desc: "Inquiries & standard forms", icon: Sparkle },
                { id: "Premium Support", desc: "Urgent academic assistance", icon: Lightning },
                { id: "Consultation", desc: "One-on-one advising session", icon: Users },
                { id: "Billing", desc: "Tuition, balances & refunds", icon: Receipt },
              ] as { id: PurposeOfVisit; desc: string; icon: any }[]
            ).map((opt) => {
              const isSel = purposeOfVisit === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className="purpose-card-btn"
                  onClick={() => setPurposeOfVisit(opt.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: isSel
                      ? "2px solid var(--blue-500)"
                      : "1.5px solid var(--slate-200)",
                    background: isSel
                      ? "linear-gradient(145deg, #eff6ff, #f8faff)"
                      : "white",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: isSel
                      ? "0 0 0 3px rgba(59,130,246,0.15), 0 4px 12px rgba(59,130,246,0.08)"
                      : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isSel ? "var(--blue-600)" : "var(--slate-100)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.18s ease",
                      }}
                    >
                      <Icon
                        size={16}
                        color={isSel ? "white" : "var(--slate-600)"}
                        weight={isSel ? "fill" : "bold"}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isSel ? "var(--blue-800)" : "var(--slate-700)",
                        }}
                      >
                        {opt.id}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--slate-400)",
                          marginTop: 2,
                          lineHeight: 1.3,
                        }}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  </div>
                  {isSel && (
                    <CheckCircle
                      size={16}
                      weight="fill"
                      color="var(--blue-600)"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>              {/* Inline booking error */}
        {bookingError && (
          <div style={{ marginBottom: 10, padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 12, color: "#dc2626", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
            <WarningCircle size={15} weight="fill" color="#dc2626" />
            <span>{bookingError}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setStep("booking")}
            disabled={bookingLoading}
            style={{ flex: 1, padding: "12px", borderRadius: 11, border: "1.5px solid var(--slate-200)", background: "white", color: "var(--slate-600)", fontSize: 14, fontWeight: 600, cursor: bookingLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'Outfit', sans-serif", opacity: bookingLoading ? 0.5 : 1 }}
          >
            <CaretLeft size={15} /> Back
          </button>
          <button
            className="btn-primary"
            onClick={handleBook}
            disabled={bookingLoading}
            style={{ flex: 2, padding: "12px", borderRadius: 11, border: "none", background: bookingLoading ? "var(--slate-400)" : "var(--blue-600)", color: "white", fontSize: 14, fontWeight: 700, cursor: bookingLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Outfit', sans-serif" }}
          >
            <Ticket size={15} /> {bookingLoading ? "Processing…" : "Confirm & Get Ticket"}
          </button>
        </div>
      </div>
      {/* Summary */}
      <div>
        <div
          className="card-shadow"
          style={{
            background: "white",
            borderRadius: 18,
            border: "1px solid rgba(226,232,240,0.6)",
            padding: "22px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "var(--slate-700)",
              marginBottom: 16,
            }}
          >
            Appointment Summary
          </div>
          {[
            {
              label: "Date",
              value: `${MONTHS[selectedDate!.month]} ${selectedDate!.day
                }, ${selectedDate!.year}`,
              icon: CalendarBlank,
            },
            { label: "Time", value: selectedSlot?.time, icon: Clock },
            {
              label: "Window",
              value:
                WINDOWS.find((w) => w.id === selectedWindow)?.label ||
                "—",
              icon:
                selectedWindow === "registrar"
                  ? IdentificationCard
                  : CreditCard,
            },
            { label: "Venue", value: VENUE, icon: MapPin },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "var(--blue-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <item.icon size={14} color="var(--blue-600)" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--slate-400)",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--slate-700)",
                    fontWeight: 600,
                  }}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: 16,
              padding: "12px",
              background: "var(--slate-50)",
              borderRadius: 10,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--slate-400)",
                marginBottom: 4,
              }}
            >
              Estimated queue position
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--slate-800)",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {`~#${(selectedWindow === "registrar" ? registrarQueue.length : cashierQueue.length) + 1}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
