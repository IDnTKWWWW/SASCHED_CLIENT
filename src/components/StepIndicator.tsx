import type React from "react";
import { motion } from "framer-motion";
import {
  CalendarBlank,
  UserCheck,
  Ticket,
  CheckCircle,
  X,
} from "@phosphor-icons/react";
import type {
  BookingStep,
  SelectedDate,
  SelectedSlot,
  BookingMode,
  PurposeOfVisit,
} from "../types/booking";

export interface StepIndicatorProps {
  step: BookingStep;
  setStep: React.Dispatch<React.SetStateAction<BookingStep>>;
  bookingLoading: boolean;
  setSelectedWindow: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<SelectedDate | null>>;
  setSelectedSlot: React.Dispatch<React.SetStateAction<SelectedSlot | null>>;
  setBookingMode: React.Dispatch<React.SetStateAction<BookingMode>>;
  setPurposeOfVisit: React.Dispatch<React.SetStateAction<PurposeOfVisit>>;
  setBookingError: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function StepIndicator({
  step,
  setStep,
  bookingLoading,
  setSelectedWindow,
  setSelectedDate,
  setSelectedSlot,
  setBookingMode,
  setPurposeOfVisit,
  setBookingError,
}: StepIndicatorProps) {
  if (step === "home") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-badge"
      style={{
        borderRadius: 18,
        padding: "12px 20px",
        marginBottom: 26,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {["booking", "confirm", "ticket"].map((s, i) => {
          const labels = [
            "Select Schedule",
            "Confirm Details",
            "Get Ticket",
          ];
          const icons = [CalendarBlank, UserCheck, Ticket];
          const Icon = icons[i];
          const isActive = step === s;
          const isDone =
            ["booking", "confirm", "ticket"].indexOf(step) > i;
          return (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                flex: i < 2 ? 1 : "none",
                cursor:
                  isDone && step !== "ticket" && !bookingLoading
                    ? "pointer"
                    : bookingLoading
                      ? "not-allowed"
                      : "default",
                opacity: bookingLoading && isDone ? 0.6 : 1,
              }}
              onClick={() => {
                if (isDone && step !== "ticket" && !bookingLoading) {
                  setStep(s as BookingStep);
                }
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: isDone
                      ? "var(--blue-600)"
                      : isActive
                        ? "var(--blue-600)"
                        : "var(--slate-200)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: isActive
                      ? "0 0 0 4px rgba(37,99,235,0.2)"
                      : "none",
                  }}
                >
                  {isDone ? (
                    <CheckCircle size={14} color="white" />
                  ) : (
                    <Icon
                      size={14}
                      color={isActive ? "white" : "var(--slate-400)"}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? "var(--blue-700)"
                      : isDone
                        ? "var(--slate-600)"
                        : "var(--slate-400)",
                  }}
                >
                  {labels[i]}
                </span>
              </div>
              {i < 2 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: isDone
                      ? "var(--blue-400)"
                      : "var(--slate-200)",
                    margin: "0 12px",
                    borderRadius: 2,
                    transition: "background 0.4s ease",
                  }}
                />
              )}
            </div>
          );
        })}
        {/* Exit / Cancel button — only shown on steps before "ticket" */}
        {step !== "ticket" && (
          <button
            disabled={bookingLoading}
            onClick={() => {
              if (bookingLoading) return;
              setStep("home");
              setSelectedWindow(null);
              setSelectedDate(null);
              setSelectedSlot(null);
              setBookingMode(null);
              setPurposeOfVisit("General");
              setBookingError(null);
            }}
            title="Cancel booking"
            style={{
              marginLeft: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 9,
              border: "1px solid var(--slate-200)",
              background: "white",
              color: "var(--slate-500)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.background = "#fff5f5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--slate-200)";
              e.currentTarget.style.color = "var(--slate-500)";
              e.currentTarget.style.background = "white";
            }}
          >
            <X size={13} />
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}
