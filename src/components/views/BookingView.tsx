import type React from "react";
import {
  CreditCard,
  IdentificationCard,
  CheckCircle,
  Users,
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Lightning,
  WarningCircle,
  CalendarPlus,
  Clock,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  WINDOWS,
  MONTHS,
  DAYS,
  BOOKING_WINDOW_DAYS,
  type BookingMode,
  type BookingStep,
  type QueueItem,
  type SelectedDate,
  type SelectedSlot,
  type WindowStatus,
} from "../../types/booking";
import type { buildTimeSlots } from "../../utils/dateAndSlots";

export interface BookingViewProps {
  selectedWindow: string | null;
  setSelectedWindow: React.Dispatch<React.SetStateAction<string | null>>;
  selectedDate: SelectedDate | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<SelectedDate | null>>;
  selectedSlot: SelectedSlot | null;
  setSelectedSlot: React.Dispatch<React.SetStateAction<SelectedSlot | null>>;
  bookingMode: BookingMode;
  setBookingMode: React.Dispatch<React.SetStateAction<BookingMode>>;
  cashierStatus: WindowStatus;
  registrarStatus: WindowStatus;
  cashierQueue: QueueItem[];
  registrarQueue: QueueItem[];
  currentMonth: number;
  currentYear: number;
  prevMonth: () => void;
  nextMonth: () => void;
  canGoPrev: () => boolean;
  canGoNext: () => boolean;
  firstDay: number;
  daysInMonth: number;
  isDisabled: (day: number) => boolean;
  isToday: (day: number) => boolean;
  selectedIsToday: boolean;
  walkinDisabled: boolean;
  laterTodayDisabled: boolean;
  activeWindowStatus: WindowStatus;
  slotLoading: boolean;
  timeSlots: ReturnType<typeof buildTimeSlots>;
  setStep: React.Dispatch<React.SetStateAction<BookingStep>>;
}

export default function BookingView({
  selectedWindow,
  setSelectedWindow,
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
  bookingMode,
  setBookingMode,
  cashierStatus,
  registrarStatus,
  cashierQueue,
  registrarQueue,
  currentMonth,
  currentYear,
  prevMonth,
  nextMonth,
  canGoPrev,
  canGoNext,
  firstDay,
  daysInMonth,
  isDisabled,
  isToday,
  selectedIsToday,
  walkinDisabled,
  laterTodayDisabled,
  activeWindowStatus,
  slotLoading,
  timeSlots,
  setStep,
}: BookingViewProps) {
  return (
    <div className="slide-up">
      {/* Window selection */}
      <div
        className="card-shadow"
        style={{
          background: "var(--surface)",
          borderRadius: 18,
          border: "1px solid var(--border-soft)",
          padding: "24px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "var(--slate-800)",
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          Select a Window
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--slate-400)",
            marginBottom: 18,
          }}
        >
          Choose which office you're visiting
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {WINDOWS.map((w) => {
            const isSelected = selectedWindow === w.id;
            const isCashier = w.id === "cashier";
            const winStatus = isCashier ? cashierStatus : registrarStatus;
            const queueList = isCashier ? cashierQueue : registrarQueue;
            const WinIcon = isCashier ? CreditCard : IdentificationCard;
            const accentColor = isCashier ? "var(--blue-600)" : "#7c3aed";

            return (
              <button
                key={w.id}
                type="button"
                className="window-card-btn"
                onClick={() => {
                  if (selectedWindow !== w.id) {
                    setSelectedWindow(w.id);
                    setSelectedSlot(null);
                    setBookingMode(null);
                  }
                }}
                style={{
                  padding: "16px 18px",
                  borderRadius: 16,
                  border: isSelected
                    ? "2px solid var(--blue-500)"
                    : "1.5px solid var(--slate-200)",
                  background: isSelected
                    ? "var(--surface-card-selected)"
                    : "var(--surface)",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(59,130,246,0.18), 0 8px 20px -6px rgba(59,130,246,0.15)"
                    : "0 2px 6px rgba(0,0,0,0.02)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: isSelected
                          ? (isCashier ? "var(--blue-600)" : "#7c3aed")
                          : (isCashier ? "rgba(37,99,235,0.08)" : "rgba(124,58,237,0.08)"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <WinIcon
                        size={20}
                        color={isSelected ? "white" : accentColor}
                        weight={isSelected ? "fill" : "bold"}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: isSelected ? "var(--blue-900)" : "var(--slate-800)",
                        }}
                      >
                        {w.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--slate-400)",
                          marginTop: 1,
                        }}
                      >
                        {w.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        background: "var(--blue-100)",
                        color: "var(--blue-700)",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}
                    >
                      <CheckCircle size={12} weight="fill" /> Selected
                    </span>
                  )}
                </div>

                {/* Live Window Status & Queue Count Chips */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 8,
                    borderTop: "1px solid " + (isSelected ? "rgba(59,130,246,0.15)" : "var(--slate-100)"),
                    fontSize: 11,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "2px 8px 2px 6px",
                      borderRadius: 99,
                      background:
                        winStatus === "open"
                          ? "rgba(34,197,94,0.1)"
                          : winStatus === "cutoff"
                            ? "rgba(245,158,11,0.12)"
                            : "rgba(239,68,68,0.1)",
                      border:
                        "1px solid " +
                        (winStatus === "open"
                          ? "rgba(34,197,94,0.25)"
                          : winStatus === "cutoff"
                            ? "rgba(245,158,11,0.3)"
                            : "rgba(239,68,68,0.25)"),
                    }}
                  >
                    <span
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background:
                          winStatus === "open"
                            ? "#16a34a"
                            : winStatus === "cutoff"
                              ? "#d97706"
                              : "#dc2626",
                        boxShadow:
                          winStatus === "open"
                            ? "0 0 8px rgba(34,197,94,0.6)"
                            : winStatus === "cutoff"
                              ? "0 0 8px rgba(245,158,11,0.6)"
                              : "0 0 8px rgba(239,68,68,0.5)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        color:
                          winStatus === "open"
                            ? "#15803d"
                            : winStatus === "cutoff"
                              ? "#b45309"
                              : "#b91c1c",
                      }}
                    >
                      {winStatus === "open"
                        ? "Open"
                        : winStatus === "cutoff"
                          ? "Cut-off Mode"
                          : "Closed Today"}
                    </span>
                  </div>
                  <span
                    style={{
                      color: "var(--slate-400)",
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Users size={12} />
                    {queueList.length === 0 ? "No wait" : `${queueList.length} in queue`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar + Slots */}
      <div
        className="booking-cal-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Calendar */}
        <div
          className="card-shadow"
          style={{
            background: "var(--surface)",
            borderRadius: 18,
            border: "1px solid var(--border-soft)",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--slate-800)",
              marginBottom: 4,
              letterSpacing: "-0.01em",
            }}
          >
            Select a Date
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--slate-400)",
              marginBottom: 20,
            }}
          >
            Bookings open up to {BOOKING_WINDOW_DAYS} days ahead
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <button
              onClick={prevMonth}
              disabled={!canGoPrev()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: "1px solid var(--slate-200)",
                background: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canGoPrev() ? "pointer" : "default",
                opacity: canGoPrev() ? 1 : 0.3,
              }}
            >
              <CaretLeft size={16} color="var(--slate-600)" />
            </button>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "var(--slate-800)",
              }}
            >
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              disabled={!canGoNext()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: "1px solid var(--slate-200)",
                background: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canGoNext() ? "pointer" : "default",
                opacity: canGoNext() ? 1 : 0.3,
              }}
            >
              <CaretRight size={16} color="var(--slate-600)" />
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              marginBottom: 8,
            }}
          >
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--slate-400)",
                  padding: "4px 0",
                  letterSpacing: "0.04em",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
            }}
          >
            {Array(firstDay)
              .fill(null)
              .map((_, i) => (
                <div key={`e${i}`} />
              ))}
            {Array(daysInMonth)
              .fill(null)
              .map((_, i) => {
                const day = i + 1;
                const disabled = isDisabled(day);
                const isTod = isToday(day);
                const isSel =
                  selectedDate &&
                  selectedDate.day === day &&
                  selectedDate.month === currentMonth &&
                  selectedDate.year === currentYear;
                return (
                  <div
                    key={day}
                    className={disabled ? "" : "cal-day"}
                    onClick={() =>
                      !disabled &&
                      (setSelectedDate({
                        day,
                        month: currentMonth,
                        year: currentYear,
                      }),
                        setSelectedSlot(null),
                        setBookingMode(null))
                    }
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: isSel ? 700 : isTod ? 600 : 400,
                      background: isSel
                        ? "var(--blue-600)"
                        : isTod && !isSel
                          ? "var(--blue-50)"
                          : "transparent",
                      color: isSel
                        ? "white"
                        : disabled
                          ? "var(--slate-300)"
                          : isTod
                            ? "var(--blue-700)"
                            : "var(--slate-700)",
                      border:
                        isTod && !isSel
                          ? "1.5px solid var(--blue-300)"
                          : "1.5px solid transparent",
                      cursor: disabled ? "default" : "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: isSel
                        ? "0 4px 12px rgba(37,99,235,0.3)"
                        : "none",
                      position: "relative",
                    }}
                  >
                    {day}
                    {isTod && !isSel && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 3,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "var(--blue-500)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
          </div>
          {selectedDate && (
            <div
              className="fade-in"
              style={{
                marginTop: 16,
                background: "var(--blue-50)",
                border: "1px solid var(--blue-100)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--blue-700)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle size={14} color="var(--blue-600)" />
              {MONTHS[selectedDate.month]} {selectedDate.day},{" "}
              {selectedDate.year}
              {selectedIsToday && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--blue-600)",
                    background: "var(--surface)",
                    border: "1px solid var(--blue-200)",
                    borderRadius: 99,
                    padding: "2px 8px",
                  }}
                >
                  TODAY
                </span>
              )}
            </div>
          )}
        </div>

        {/* Time Slots / Booking Mode */}
        <div
          className="card-shadow"
          style={{
            background: "var(--surface)",
            borderRadius: 18,
            border: "1px solid var(--border-soft)",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--slate-800)",
              marginBottom: 4,
              letterSpacing: "-0.01em",
            }}
          >
            {selectedIsToday
              ? "How would you like to book?"
              : "Choose a Time Slot"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--slate-400)",
              marginBottom: 20,
            }}
          >
            {!selectedDate
              ? "Select a date first"
              : selectedIsToday
                ? "Pick an option for today's appointment"
                : `Available times for ${MONTHS[selectedDate.month]} ${selectedDate.day
                }`}
          </div>

          {!selectedDate && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--slate-400)",
              }}
            >
              <CalendarBlank
                size={36}
                color="var(--slate-300)"
                style={{ marginBottom: 12 }}
              />
              <div style={{ fontSize: 13 }}>
                Please pick a date to see available time slots
              </div>
            </div>
          )}

          {selectedDate && selectedIsToday && bookingMode === null && (
            <div
              className="fade-in"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* WALK-IN BUTTON */}
              <button
                className="mode-card"
                disabled={walkinDisabled}
                onClick={() => {
                  if (walkinDisabled) return;
                  setBookingMode("now");
                  setSelectedSlot({ id: 0, time: "Walk-in / Now" });
                  if (selectedWindow) setStep("confirm");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "20px 22px",
                  borderRadius: 16,
                  border: walkinDisabled
                    ? "2px solid var(--slate-200)"
                    : "2px solid var(--blue-200)",
                  background: walkinDisabled
                    ? "var(--slate-50)"
                    : "var(--surface-mode-tint)",
                  cursor: walkinDisabled ? "not-allowed" : "pointer",
                  opacity: walkinDisabled ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 13,
                      background: walkinDisabled
                        ? "var(--slate-400)"
                        : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Lightning size={22} color="white" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: walkinDisabled
                          ? "var(--slate-600)"
                          : "var(--blue-800)",
                      }}
                    >
                      Get a Ticket Now
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--slate-500)",
                        marginTop: 2,
                      }}
                    >
                      Enters the instant queue. Served on arrival.
                    </div>
                    {walkinDisabled ? (
                      <div
                        style={{
                          marginTop: 10,
                          display: "inline-flex",
                          gap: 5,
                          alignItems: "center",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 99,
                          padding: "4px 10px",
                          fontSize: 11,
                          color: "var(--red-600)",
                          fontWeight: 700,
                        }}
                      >
                        <WarningCircle size={10} />{" "}
                        {!selectedWindow
                          ? "Select a window first"
                          : activeWindowStatus === "closed"
                            ? "Window Closed Today"
                            : "Cut-off Mode Active"}
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 10,
                          display: "inline-flex",
                          gap: 5,
                          alignItems: "center",
                          background: "var(--surface)",
                          border: "1px solid var(--blue-200)",
                          borderRadius: 99,
                          padding: "4px 10px",
                          fontSize: 11,
                          color: "var(--blue-700)",
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--green-500)",
                          }}
                        />{" "}
                        Walk-in Open
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* SCHEDULE FOR LATER BUTTON */}
              <button
                className="mode-card"
                disabled={laterTodayDisabled}
                onClick={() => {
                  if (laterTodayDisabled) return;
                  setBookingMode("later");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "20px 22px",
                  borderRadius: 16,
                  border: laterTodayDisabled
                    ? "2px solid var(--slate-200)"
                    : "2px solid var(--slate-300)",
                  background: "var(--slate-50)",
                  cursor: laterTodayDisabled ? "not-allowed" : "pointer",
                  opacity: laterTodayDisabled ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 13,
                      background: laterTodayDisabled
                        ? "var(--slate-300)"
                        : "linear-gradient(135deg, #475569, #334155)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CalendarPlus size={22} color="white" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: laterTodayDisabled
                          ? "var(--slate-500)"
                          : "var(--slate-700)",
                      }}
                    >
                      Schedule for Later Today
                    </div>
                    <div
                      style={{ fontSize: 12, color: "var(--slate-500)" }}
                    >
                      Select a structural time reservation slot.
                    </div>
                    {laterTodayDisabled ? (
                      <div
                        style={{
                          marginTop: 10,
                          display: "inline-flex",
                          gap: 5,
                          alignItems: "center",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 99,
                          padding: "4px 10px",
                          fontSize: 11,
                          color: "var(--red-600)",
                          fontWeight: 700,
                        }}
                      >
                        <WarningCircle size={10} />{" "}
                        {!selectedWindow
                          ? "Select a window first"
                          : "Window Closed Today"}
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            </div>
          )}

          {selectedDate && selectedIsToday && bookingMode === "later" && (
            <div className="fade-in">
              <button
                onClick={() => {
                  setBookingMode(null);
                  setSelectedSlot(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 16,
                  fontSize: 12,
                  color: "var(--blue-600)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif",
                  fontWeight: 600,
                }}
              >
                <CaretLeft size={14} /> Back to options
              </button>
              {slotLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--slate-400)", fontSize: 13 }}>
                  Loading available slots…
                </div>
              ) : timeSlots.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "28px 20px",
                    color: "var(--slate-400)",
                  }}
                >
                  <Clock
                    size={32}
                    color="var(--slate-300)"
                    style={{ marginBottom: 10 }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--slate-600)",
                      marginBottom: 4,
                    }}
                  >
                    No remaining slots today
                  </div>
                  <div style={{ fontSize: 12 }}>
                    All time slots have passed. Use "Get a Ticket Now" or
                    pick another date.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    maxHeight: 340,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {["Morning", "Afternoon"].map((period) => {
                    const slots = timeSlots.filter((s) =>
                      period === "Morning"
                        ? s.time.includes("AM")
                        : s.time.includes("PM")
                    );
                    if (slots.length === 0) return null;
                    return (
                      <div key={period}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--slate-400)",
                            letterSpacing: "0.06em",
                            marginBottom: 8,
                            paddingLeft: 2,
                          }}
                        >
                          {period.toUpperCase()}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            marginBottom: 14,
                          }}
                        >
                          {slots.map((slot) => {
                            const full = slot.available === 0;
                            const isSel = selectedSlot?.id === slot.id;
                            const pct =
                              (slot.total - slot.available) / slot.total;
                            return (
                              <button
                                key={slot.id}
                                className="slot-btn"
                                disabled={full}
                                onClick={() => setSelectedSlot(slot)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "12px 14px",
                                  borderRadius: 12,
                                  cursor: full
                                    ? "not-allowed"
                                    : "pointer",
                                  border: isSel
                                    ? "2px solid var(--blue-500)"
                                    : "1.5px solid " +
                                    (full
                                      ? "var(--slate-100)"
                                      : "var(--slate-200)"),
                                  background: isSel
                                    ? "var(--blue-50)"
                                    : full
                                      ? "var(--slate-50)"
                                      : "var(--surface)",
                                  fontFamily: "'Outfit', sans-serif",
                                  boxShadow: isSel
                                    ? "0 0 0 3px rgba(59,130,246,0.15)"
                                    : "none",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  <Clock
                                    size={14}
                                    color={
                                      isSel
                                        ? "var(--blue-600)"
                                        : full
                                          ? "var(--slate-300)"
                                          : "var(--slate-400)"
                                    }
                                  />
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: isSel
                                        ? "var(--blue-700)"
                                        : full
                                          ? "var(--slate-300)"
                                          : "var(--slate-700)",
                                    }}
                                  >
                                    {slot.time}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 60,
                                      height: 4,
                                      background: "var(--slate-100)",
                                      borderRadius: 99,
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: "100%",
                                        width: `${pct * 100}%`,
                                        borderRadius: 99,
                                        background:
                                          pct > 0.8
                                            ? "var(--red-400)"
                                            : pct > 0.5
                                              ? "var(--amber-400)"
                                              : "var(--green-400)",
                                        transition: "width 0.3s ease",
                                      }}
                                    />
                                  </div>
                                  {full ? (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "var(--slate-300)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Full
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color:
                                          slot.available <= 2
                                            ? "var(--red-500)"
                                            : "var(--green-600)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {slot.available} left
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedDate && !selectedIsToday && (
            <>
              {timeSlots.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "var(--slate-400)",
                  }}
                >
                  <Clock
                    size={36}
                    color="var(--slate-300)"
                    style={{ marginBottom: 12 }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--slate-600)",
                      marginBottom: 4,
                    }}
                  >
                    No slots available
                  </div>
                  <div style={{ fontSize: 12 }}>
                    Please select another date.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    maxHeight: 380,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {["Morning", "Afternoon"].map((period) => {
                    const slots = timeSlots.filter((s) =>
                      period === "Morning"
                        ? s.time.includes("AM")
                        : s.time.includes("PM")
                    );
                    if (slots.length === 0) return null;
                    return (
                      <div key={period}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--slate-400)",
                            letterSpacing: "0.06em",
                            marginBottom: 8,
                            paddingLeft: 2,
                          }}
                        >
                          {period.toUpperCase()}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            marginBottom: 14,
                          }}
                        >
                          {slots.map((slot) => {
                            const full = slot.available === 0;
                            const isSel = selectedSlot?.id === slot.id;
                            const pct =
                              (slot.total - slot.available) / slot.total;
                            return (
                              <button
                                key={slot.id}
                                className="slot-btn"
                                disabled={full}
                                onClick={() => setSelectedSlot(slot)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "12px 14px",
                                  borderRadius: 12,
                                  cursor: full
                                    ? "not-allowed"
                                    : "pointer",
                                  border: isSel
                                    ? "2px solid var(--blue-500)"
                                    : "1.5px solid " +
                                    (full
                                      ? "var(--slate-100)"
                                      : "var(--slate-200)"),
                                  background: isSel
                                    ? "var(--blue-50)"
                                    : full
                                      ? "var(--slate-50)"
                                      : "var(--surface)",
                                  fontFamily: "'Outfit', sans-serif",
                                  boxShadow: isSel
                                    ? "0 0 0 3px rgba(59,130,246,0.15)"
                                    : "none",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  <Clock
                                    size={14}
                                    color={
                                      isSel
                                        ? "var(--blue-600)"
                                        : full
                                          ? "var(--slate-300)"
                                          : "var(--slate-400)"
                                    }
                                  />
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: isSel
                                        ? "var(--blue-700)"
                                        : full
                                          ? "var(--slate-300)"
                                          : "var(--slate-700)",
                                    }}
                                  >
                                    {slot.time}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 60,
                                      height: 4,
                                      background: "var(--slate-100)",
                                      borderRadius: 99,
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: "100%",
                                        width: `${pct * 100}%`,
                                        borderRadius: 99,
                                        background:
                                          pct > 0.8
                                            ? "var(--red-400)"
                                            : pct > 0.5
                                              ? "var(--amber-400)"
                                              : "var(--green-400)",
                                        transition: "width 0.3s ease",
                                      }}
                                    />
                                  </div>
                                  {full ? (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "var(--slate-300)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Full
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color:
                                          slot.available <= 2
                                            ? "var(--red-500)"
                                            : "var(--green-600)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {slot.available} left
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {selectedDate && selectedSlot && selectedWindow && (
            <button
              className="btn-primary"
              onClick={() => setStep("confirm")}
              style={{
                marginTop: 16,
                width: "100%",
                background: "var(--blue-600)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "13px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Continue to Confirm <ArrowRight size={15} />
            </button>
          )}
          {selectedDate && selectedSlot && !selectedWindow && (
            <div
              style={{
                marginTop: 14,
                background: "var(--notice-cutoff-bg)",
                border: "1px solid var(--notice-cutoff-border)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--notice-cutoff-title)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <WarningCircle size={13} color="var(--notice-cutoff-icon)" /> Please select a
              window above first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
