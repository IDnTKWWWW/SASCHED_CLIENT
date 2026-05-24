// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Bell,
  BookOpen,
  Ticket,
  ArrowRight,
  MapPin,
  GraduationCap,
  X,
  Download,
  Share2,
  AlertCircle,
  Lock,
  UserCheck,
  Zap,
  CalendarClock,
  BellRing,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SCHOOL_NAME = "STI Calamba";
const DEPT = "(SAS) Appointment system";
const VENUE = "First Floor, Main Building";
const BOOKING_WINDOW_DAYS = 14;

// ─── MOCK AUTHENTICATION ──────────────────────────────────────────────────────
const LOGGED_IN_USER = {
  name: "Juan dela Cruz",
  studentId: "04-2201",
  course: "BSIT",
};

// ─── WINDOWS / DEPARTMENTS ────────────────────────────────────────────────────
const WINDOWS = [
  {
    id: "cashier",
    label: "Cashier Window",
    desc: "Payments, fees & clearances",
    dept: "Cashier",
  },
  {
    id: "registrar",
    label: "Registrar Window",
    desc: "Enrollment, records & forms",
    dept: "Registrar",
  },
];

// ─── TIME SLOTS ───────────────────────────────────────────────────────────────
const buildTimeSlots = (isToday) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const allSlots = [
    { id: 1, time: "8:00 AM", hour: 8, minute: 0, available: 3, total: 5 },
    { id: 2, time: "8:30 AM", hour: 8, minute: 30, available: 0, total: 5 },
    { id: 3, time: "9:00 AM", hour: 9, minute: 0, available: 2, total: 5 },
    { id: 4, time: "9:30 AM", hour: 9, minute: 30, available: 5, total: 5 },
    { id: 5, time: "10:00 AM", hour: 10, minute: 0, available: 1, total: 5 },
    { id: 6, time: "10:30 AM", hour: 10, minute: 30, available: 4, total: 5 },
    { id: 7, time: "11:00 AM", hour: 11, minute: 0, available: 0, total: 5 },
    { id: 8, time: "1:00 PM", hour: 13, minute: 0, available: 5, total: 5 },
    { id: 9, time: "1:30 PM", hour: 13, minute: 30, available: 3, total: 5 },
    { id: 10, time: "2:00 PM", hour: 14, minute: 0, available: 2, total: 5 },
    { id: 11, time: "2:30 PM", hour: 14, minute: 30, available: 4, total: 5 },
    { id: 12, time: "3:00 PM", hour: 15, minute: 0, available: 1, total: 5 },
  ];

  if (!isToday) return allSlots;

  return allSlots.filter((slot) => {
    const slotTotalMinutes = slot.hour * 60 + slot.minute;
    const nowTotalMinutes = currentHour * 60 + currentMinute;
    return slotTotalMinutes > nowTotalMinutes + 30;
  });
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [bookingMode, setBookingMode] = useState(null);
  const [step, setStep] = useState("home");
  const [ticket, setTicket] = useState(null);
  const [ticketVisible, setTicketVisible] = useState(false);
  const [pulseQueue, setPulseQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);

  // ── Split "Now Serving" per department ──────────────────────
  const [nowServingCashier, setNowServingCashier] = useState(null);
  const [nowServingRegistrar, setNowServingRegistrar] = useState(null);

  // ── Split live queue per department ─────────────────────────
  const [cashierQueue, setCashierQueue] = useState([]);
  const [registrarQueue, setRegistrarQueue] = useState([]);

  // ── Total across both departments ───────────────────────────
  const [liveQueueCount, setLiveQueueCount] = useState(null);

  // ── Pulse animation ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseQueue(true);
      setTimeout(() => setPulseQueue(false), 1000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── Realtime Refs to prevent WebSocket disconnections ────────
  const ticketRef = useRef(ticket);
  useEffect(() => {
    ticketRef.current = ticket;
  }, [ticket]);

  // ── Fetch & Realtime Sync ────────────────────────────────────
  useEffect(() => {
    const fetchInitial = async () => {
      // 1. Now Serving (Fetch both windows)
      const { data: servingData } = await supabase
        .from("queue_tickets")
        .select("ticket_number, department")
        .eq("status", "serving");

      if (servingData) {
        const cashierRow = servingData.find((r) => r.department === "Cashier");
        const registrarRow = servingData.find(
          (r) => r.department === "Registrar"
        );
        if (cashierRow) setNowServingCashier(cashierRow.ticket_number);
        if (registrarRow) setNowServingRegistrar(registrarRow.ticket_number);
      }

      // 2. Waiting Queue (Fetch rows + exact count in one go so they never desync)
      const {
        data: waitingData,
        count,
        error,
      } = await supabase
        .from("queue_tickets")
        .select("ticket_number, student_name, appointment_time, department", {
          count: "exact",
        })
        .eq("status", "waiting")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Database fetch error:", error);
      }

      if (waitingData) {
        setCashierQueue(waitingData.filter((r) => r.department === "Cashier"));
        setRegistrarQueue(
          waitingData.filter((r) => r.department === "Registrar")
        );
        setLiveQueueCount(count !== null ? count : waitingData.length);
      }
    };

    fetchInitial();

    const channel = supabase
      .channel("student_queue_watch")
      // New ticket inserted
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "queue_tickets" },
        (payload) => {
          const row = payload.new;
          if (row.status !== "waiting") return;

          const item = {
            ticket_number: row.ticket_number,
            student_name: row.student_name,
            appointment_time: row.appointment_time,
            department: row.department,
          };

          setLiveQueueCount((prev) => (prev ?? 0) + 1);

          if (row.department === "Cashier") {
            setCashierQueue((prev) => [...prev, item]);
          } else if (row.department === "Registrar") {
            setRegistrarQueue((prev) => [...prev, item]);
          }
        }
      )
      // Ticket status changed
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "queue_tickets" },
        (payload) => {
          const row = payload.new;
          const dept = row.department;

          // Remove from waiting lists
          if (["serving", "served", "noshow", "removed"].includes(row.status)) {
            setCashierQueue((q) => {
              if (q.some((r) => r.ticket_number === row.ticket_number)) {
                setLiveQueueCount((c) => Math.max(0, (c ?? 1) - 1));
                return q.filter((r) => r.ticket_number !== row.ticket_number);
              }
              return q;
            });
            setRegistrarQueue((q) => {
              if (q.some((r) => r.ticket_number === row.ticket_number)) {
                setLiveQueueCount((c) => Math.max(0, (c ?? 1) - 1));
                return q.filter((r) => r.ticket_number !== row.ticket_number);
              }
              return q;
            });
          }

          // Update "Now Serving"
          if (row.status === "serving") {
            if (dept === "Cashier") setNowServingCashier(row.ticket_number);
            if (dept === "Registrar") setNowServingRegistrar(row.ticket_number);
          }

          // Clear "Now Serving"
          if (["served", "noshow", "removed"].includes(row.status)) {
            if (dept === "Cashier") {
              setNowServingCashier((prev) =>
                prev === row.ticket_number ? null : prev
              );
            }
            if (dept === "Registrar") {
              setNowServingRegistrar((prev) =>
                prev === row.ticket_number ? null : prev
              );
            }
          }

          // Check if it's YOUR turn (Using a Ref so the socket never drops!)
          if (ticketRef.current && row.status === "serving") {
            if (row.ticket_number === ticketRef.current.number) {
              setIsYourTurn(true);
            }

            const fetchPosition = async () => {
              const { data, err } = await supabase
                .from("queue_tickets")
                .select("ticket_number")
                .eq("status", "waiting")
                .order("created_at", { ascending: true });

              if (!err && data) {
                const myIndex = data.findIndex(
                  (r) => r.ticket_number === ticketRef.current.number
                );
                setQueuePosition(myIndex === -1 ? 0 : myIndex + 1);
              }
            };
            fetchPosition();
          }
        }
      )
      .subscribe();

    // Because the dependency array is empty, this connection will NEVER drop!
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Derived: nowServing for the user's department ────────────
  const userDeptNowServing =
    ticket?.window === "Cashier Window"
      ? nowServingCashier
      : ticket?.window === "Registrar Window"
      ? nowServingRegistrar
      : null;

  // ── Date helpers ─────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const isPast = (day) => new Date(currentYear, currentMonth, day) < today;
  const isBeyondWindow = (day) => {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + BOOKING_WINDOW_DAYS);
    return new Date(currentYear, currentMonth, day) > cutoff;
  };
  const isWeekend = (day) =>
    new Date(currentYear, currentMonth, day).getDay() === 0;
  const isToday = (day) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();
  const isDisabled = (day) =>
    isPast(day) || isBeyondWindow(day) || isWeekend(day);

  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() + BOOKING_WINDOW_DAYS);
  const canGoPrev = () =>
    currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());
  const canGoNext = () =>
    currentYear < cutoffDate.getFullYear() ||
    (currentYear === cutoffDate.getFullYear() &&
      currentMonth < cutoffDate.getMonth());

  const prevMonth = () => {
    if (!canGoPrev()) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (!canGoNext()) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const selectedIsToday = selectedDate
    ? isToday(selectedDate.day) &&
      selectedDate.month === today.getMonth() &&
      selectedDate.year === today.getFullYear()
    : false;

  const timeSlots = buildTimeSlots(selectedIsToday);

  // ── Booking (Fixed Supabase Connection!) ──────────────────────
  const handleBook = async () => {
    const windowObj = WINDOWS.find((w) => w.id === selectedWindow);
    const windowLabel = windowObj?.label || "—";
    const department = windowObj?.dept || "Cashier";

    // Generate smart ticket prefix
    const prefix = department === "Cashier" ? "C" : "R";
    const num = prefix + "-" + String(Math.floor(Math.random() * 900) + 100);

    // Save to Supabase
    const { error } = await supabase.from("queue_tickets").insert([
      {
        ticket_number: num,
        student_name: LOGGED_IN_USER.name,
        student_id: LOGGED_IN_USER.studentId,
        course: LOGGED_IN_USER.course,
        destination_window: windowLabel,
        department: department,
        appointment_time: selectedSlot.time,
        status: "waiting",
        booking_type: "booked",
      },
    ]);

    if (error) {
      console.error("Insert error:", error);
      alert("Failed to connect to database.");
      return;
    }

    setTicket({
      number: num,
      date: `${MONTHS[selectedDate.month]} ${selectedDate.day}, ${
        selectedDate.year
      }`,
      time: selectedSlot.time,
      name: LOGGED_IN_USER.name,
      id: LOGGED_IN_USER.studentId,
      course: LOGGED_IN_USER.course,
      window: windowLabel,
      venue: VENUE,
      issued: new Date().toLocaleString(),
    });
    setStep("ticket");
    setTimeout(() => setTicketVisible(true), 100);
  };

  const reset = () => {
    setStep("home");
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedWindow(null);
    setBookingMode(null);
    setTicket(null);
    setTicketVisible(false);
    setQueuePosition(null);
  };

  // ── Reusable queue column ─────────────────────────────────────
  const QueueColumn = ({
    title,
    icon,
    accentColor,
    nowServingTicket,
    queue,
  }) => (
    <div
      className="card-shadow"
      style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid rgba(226,232,240,0.6)",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--slate-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon}
          <span
            style={{ fontWeight: 700, fontSize: 14, color: "var(--slate-700)" }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: accentColor,
              background: accentColor + "18",
              border: `1px solid ${accentColor}30`,
              borderRadius: 99,
              padding: "2px 8px",
            }}
          >
            {queue.length} waiting
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "var(--green-600)",
            fontWeight: 600,
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
          LIVE
        </div>
      </div>
      {/* Now Serving row */}
      <div
        style={{
          padding: "10px 20px",
          background: accentColor + "08",
          borderBottom: "1px solid var(--slate-100)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "0.07em",
            marginBottom: 4,
          }}
        >
          NOW SERVING
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className={pulseQueue && nowServingTicket ? "pulse-ring" : ""}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: nowServingTicket ? 26 : 18,
              fontWeight: 700,
              color: nowServingTicket ? "var(--slate-800)" : "var(--slate-300)",
              letterSpacing: "0.02em",
            }}
          >
            {nowServingTicket ?? "---"}
          </div>
          {nowServingTicket && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: accentColor,
                background: accentColor + "18",
                border: `1px solid ${accentColor}30`,
                borderRadius: 99,
                padding: "3px 9px",
              }}
            >
              AT WINDOW
            </span>
          )}
          {!nowServingTicket && (
            <span style={{ fontSize: 11, color: "var(--slate-400)" }}>
              Window is ready
            </span>
          )}
        </div>
      </div>
      {/* Queue rows */}
      <div style={{ padding: "6px 0", maxHeight: 220, overflowY: "auto" }}>
        {queue.length === 0 ? (
          <div
            style={{
              padding: "18px 20px",
              fontSize: 13,
              color: "var(--slate-400)",
              textAlign: "center",
            }}
          >
            No students waiting.
          </div>
        ) : (
          queue.map((q, i) => (
            <div
              key={q.ticket_number}
              className="queue-item"
              style={{
                padding: "9px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderLeft: "3px solid transparent",
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--slate-400)",
                  minWidth: 46,
                }}
              >
                {q.ticket_number}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--slate-700)",
                  }}
                >
                  {q.student_name}
                </div>
                <div style={{ fontSize: 11, color: "var(--slate-400)" }}>
                  {q.appointment_time}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--slate-400)",
                  fontWeight: 500,
                }}
              >
                #{i + 1}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        fontFamily: "'Outfit', 'DM Sans', sans-serif",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 40%, #f5f8ff 100%)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --blue-50:#eff6ff; --blue-100:#dbeafe; --blue-200:#bfdbfe;
          --blue-400:#60a5fa; --blue-500:#3b82f6; --blue-600:#2563eb;
          --blue-700:#1d4ed8; --blue-800:#1e40af; --blue-900:#1e3a8a;
          --slate-50:#f8fafc; --slate-100:#f1f5f9; --slate-200:#e2e8f0;
          --slate-300:#cbd5e1; --slate-400:#94a3b8; --slate-500:#64748b;
          --slate-600:#475569; --slate-700:#334155; --slate-800:#1e293b;
          --slate-900:#0f172a;
          --green-400:#4ade80; --green-500:#22c55e; --green-600:#16a34a;
          --amber-400:#fbbf24; --amber-500:#f59e0b;
          --red-400:#f87171; --red-500:#ef4444;
        }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        .slide-up { animation: slideUp 0.5s cubic-bezier(.22,.68,0,1.2) forwards; }
        @keyframes slideUp { from{opacity:0;transform:translateY(32px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);} }
        .ticket-appear { animation: ticketIn 0.6s cubic-bezier(.22,.68,0,1.2) forwards; }
        @keyframes ticketIn { from{opacity:0;transform:scale(0.85) translateY(24px);}to{opacity:1;transform:scale(1) translateY(0);} }
        .pulse-ring { animation: pulseRing 1.5s ease-out; }
        @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(59,130,246,0.4);}100%{box-shadow:0 0 0 20px rgba(59,130,246,0);} }
        .slot-btn { transition: all 0.18s ease; }
        .slot-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .cal-day { transition: all 0.15s ease; cursor: pointer; }
        .cal-day:hover { background: var(--blue-100) !important; }
        .card-shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(59,130,246,0.08); }
        .ticket-shadow { box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(37,99,235,0.18); }
        .btn-primary { transition: all 0.2s ease; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,99,235,0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .queue-item { transition: all 0.3s ease; }
        .queue-item:hover { background: var(--blue-50); }
        .window-btn { transition: all 0.18s ease; cursor: pointer; }
        .window-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(37,99,235,0.15); }
        .mode-card { transition: all 0.2s ease; cursor: pointer; }
        .mode-card:hover { transform: translateY(-3px); }
        .your-turn-modal { animation: yourTurnIn 0.5s cubic-bezier(.22,.68,0,1.2) forwards; }
        @keyframes yourTurnIn { from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);} }
        .your-turn-pulse { animation: yourTurnPulse 1.4s ease-in-out infinite; }
        @keyframes yourTurnPulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.85;transform:scale(1.03);} }
        .bell-shake { animation: bellShake 0.8s ease-in-out infinite; }
        @keyframes bellShake { 0%,100%{transform:rotate(0deg);}20%{transform:rotate(-18deg);}40%{transform:rotate(18deg);}60%{transform:rotate(-12deg);}80%{transform:rotate(12deg);} }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--slate-300); border-radius: 99px; }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(226,232,240,0.8)",
          position: "sticky",
          top: 0,
          zIndex: 50,
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
              alt="STI Logo"
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "var(--blue-50)",
                border: "1px solid var(--blue-100)",
                borderRadius: 99,
                padding: "5px 12px",
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
                {LOGGED_IN_USER.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--blue-400)" }}>
                · {LOGGED_IN_USER.studentId}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--blue-50)",
                border: "1px solid var(--blue-100)",
                borderRadius: 99,
                padding: "5px 12px",
                fontSize: 12,
                color: "var(--blue-600)",
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--green-500)",
                  animation: "pulse 2s infinite",
                }}
              />
              Live System Active
            </div>
          </div>
        </div>
      </header>

      <main
        style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}
      >
        {/* ── STEP INDICATOR ──────────────────────────────────────── */}
        {step !== "home" && (
          <div className="fade-in" style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {["booking", "confirm", "ticket"].map((s, i) => {
                const labels = [
                  "Select Schedule",
                  "Confirm Details",
                  "Get Ticket",
                ];
                const icons = [CalendarDays, UserCheck, Ticket];
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
                          <CheckCircle2 size={14} color="white" />
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
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* HOME VIEW                                              */}
        {/* ════════════════════════════════════════════════════════ */}
        {step === "home" && (
          <div className="fade-in">
            {/* Hero — with two Now Serving cards */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)",
                borderRadius: 20,
                padding: "36px 36px 32px",
                marginBottom: 24,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -60,
                  right: 80,
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.03)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 20,
                  }}
                >
                  {/* Left: copy */}
                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: 99,
                        padding: "4px 12px",
                        marginBottom: 14,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.9)",
                        fontWeight: 500,
                        letterSpacing: "0.04em",
                      }}
                    >
                      <BookOpen size={11} /> ENROLLMENT PERIOD · AY 2025–2026
                    </div>
                    <h1
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 28,
                        fontWeight: 800,
                        color: "white",
                        lineHeight: 1.2,
                        letterSpacing: "-0.02em",
                        marginBottom: 8,
                      }}
                    >
                      Skip the Line.
                      <br />
                      Book Your Slot Online.
                    </h1>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 14,
                        lineHeight: 1.6,
                        maxWidth: 400,
                      }}
                    >
                      Reserve your enrollment appointment in minutes. Get a
                      digital ticket and arrive at your exact time — no waiting.
                    </p>
                    <button
                      className="btn-primary"
                      onClick={() => setStep("booking")}
                      style={{
                        marginTop: 22,
                        background: "white",
                        color: "var(--blue-700)",
                        border: "none",
                        borderRadius: 12,
                        padding: "12px 24px",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      Book an Appointment <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Right: two Now Serving cards side-by-side */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* Cashier Window */}
                    <div
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 16,
                        padding: "18px 20px",
                        minWidth: 148,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.6)",
                          fontWeight: 600,
                          letterSpacing: "0.07em",
                          marginBottom: 4,
                        }}
                      >
                        CASHIER
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.5)",
                          marginBottom: 8,
                        }}
                      >
                        Now Serving
                      </div>
                      <div
                        className={
                          pulseQueue && nowServingCashier ? "pulse-ring" : ""
                        }
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: nowServingCashier ? 30 : 20,
                          fontWeight: 700,
                          color: "white",
                          lineHeight: 1,
                          display: "inline-block",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {nowServingCashier ?? "---"}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.5)",
                          marginTop: 6,
                        }}
                      >
                        {nowServingCashier ? "At the window" : "Ready"}
                      </div>
                    </div>

                    {/* Registrar Window */}
                    <div
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 16,
                        padding: "18px 20px",
                        minWidth: 148,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.6)",
                          fontWeight: 600,
                          letterSpacing: "0.07em",
                          marginBottom: 4,
                        }}
                      >
                        REGISTRAR
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.5)",
                          marginBottom: 8,
                        }}
                      >
                        Now Serving
                      </div>
                      <div
                        className={
                          pulseQueue && nowServingRegistrar ? "pulse-ring" : ""
                        }
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: nowServingRegistrar ? 30 : 20,
                          fontWeight: 700,
                          color: "white",
                          lineHeight: 1,
                          display: "inline-block",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {nowServingRegistrar ?? "---"}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.5)",
                          marginTop: 6,
                        }}
                      >
                        {nowServingRegistrar ? "At the window" : "Ready"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row — total in queue */}
            <div style={{ marginBottom: 24 }}>
              <div
                className="card-shadow"
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: "16px 18px",
                  border: "1px solid rgba(226,232,240,0.6)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 16,
                  minWidth: 220,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#2563eb15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={20} color="#2563eb" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--slate-500)",
                      fontWeight: 500,
                      marginBottom: 2,
                    }}
                  >
                    In Queue Today
                  </div>
                  <div
                    style={{
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: 28,
                      fontWeight: 800,
                      color: "var(--slate-800)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {liveQueueCount === null ? "—" : liveQueueCount}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--slate-400)",
                      marginTop: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background:
                          liveQueueCount === null
                            ? "var(--slate-300)"
                            : "var(--green-500)",
                      }}
                    />
                    {liveQueueCount === null
                      ? "Loading…"
                      : `Cashier: ${cashierQueue.length} · Registrar: ${registrarQueue.length}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Split queue + Notice */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 340px",
                gap: 16,
              }}
            >
              {/* Two queue columns side by side */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <QueueColumn
                    title="Cashier Window"
                    icon={<Users size={15} color="#2563eb" />}
                    accentColor="#2563eb"
                    nowServingTicket={nowServingCashier}
                    queue={cashierQueue}
                  />
                  <QueueColumn
                    title="Registrar Window"
                    icon={<Users size={15} color="#7c3aed" />}
                    accentColor="#7c3aed"
                    nowServingTicket={nowServingRegistrar}
                    queue={registrarQueue}
                  />
                </div>
              </div>

              {/* Notice + Quick Links */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div
                  className="card-shadow"
                  style={{
                    background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                    border: "1px solid #fde68a",
                    borderRadius: 16,
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <AlertCircle
                      size={16}
                      color="#d97706"
                      style={{ marginTop: 1, flexShrink: 0 }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "#92400e",
                          marginBottom: 4,
                        }}
                      >
                        Enrollment Notice
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#78350f",
                          lineHeight: 1.6,
                        }}
                      >
                        Enrollment for S.Y. 2025–2026 runs{" "}
                        <strong>June 9–20, 2025</strong>. Bring your Form 138,
                        medical clearance, and 2×2 photos. Late applications are
                        not accepted.
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="card-shadow"
                  style={{
                    background: "white",
                    border: "1px solid rgba(226,232,240,0.6)",
                    borderRadius: 16,
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--slate-700)",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MapPin size={14} color="var(--blue-600)" /> Enrollment
                    Venue
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--slate-600)",
                      lineHeight: 1.7,
                    }}
                  >
                    <strong>{VENUE}</strong>
                    <br />
                    {SCHOOL_NAME} Campus
                    <br />
                    Open: Mon–Fri, 8:00 AM – 4:00 PM
                  </div>
                  <div
                    style={{
                      marginTop: 14,
                      height: 1,
                      background: "var(--slate-100)",
                    }}
                  />
                  <button
                    onClick={() => setStep("booking")}
                    className="btn-primary"
                    style={{
                      marginTop: 14,
                      width: "100%",
                      background: "var(--blue-600)",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      padding: "11px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Book My Appointment <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* BOOKING VIEW                                           */}
        {/* ════════════════════════════════════════════════════════ */}
        {step === "booking" && (
          <div className="slide-up">
            {/* Window selection */}
            <div
              className="card-shadow"
              style={{
                background: "white",
                borderRadius: 18,
                border: "1px solid rgba(226,232,240,0.6)",
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
                  return (
                    <button
                      key={w.id}
                      className="window-btn"
                      onClick={() => setSelectedWindow(w.id)}
                      style={{
                        padding: "16px 18px",
                        borderRadius: 14,
                        border: isSelected
                          ? "2px solid var(--blue-500)"
                          : "1.5px solid var(--slate-200)",
                        background: isSelected ? "var(--blue-50)" : "white",
                        textAlign: "left",
                        cursor: "pointer",
                        boxShadow: isSelected
                          ? "0 0 0 3px rgba(59,130,246,0.15)"
                          : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: isSelected
                            ? "var(--blue-700)"
                            : "var(--slate-700)",
                          marginBottom: 4,
                        }}
                      >
                        {w.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: isSelected
                            ? "var(--blue-500)"
                            : "var(--slate-400)",
                        }}
                      >
                        {w.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar + Slots */}
            <div
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
                  background: "white",
                  borderRadius: 18,
                  border: "1px solid rgba(226,232,240,0.6)",
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
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: canGoPrev() ? "pointer" : "default",
                      opacity: canGoPrev() ? 1 : 0.3,
                    }}
                  >
                    <ChevronLeft size={16} color="var(--slate-600)" />
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
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: canGoNext() ? "pointer" : "default",
                      opacity: canGoNext() ? 1 : 0.3,
                    }}
                  >
                    <ChevronRight size={16} color="var(--slate-600)" />
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
                    <CheckCircle2 size={14} color="var(--blue-600)" />
                    {MONTHS[selectedDate.month]} {selectedDate.day},{" "}
                    {selectedDate.year}
                    {selectedIsToday && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--blue-600)",
                          background: "white",
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
                  background: "white",
                  borderRadius: 18,
                  border: "1px solid rgba(226,232,240,0.6)",
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
                    : `Available times for ${MONTHS[selectedDate.month]} ${
                        selectedDate.day
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
                    <CalendarDays
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
                    <button
                      className="mode-card"
                      onClick={() => {
                        setBookingMode("now");
                        setSelectedSlot({
                          id: 0,
                          time: "Walk-in / Now",
                          hour: null,
                          minute: null,
                          available: 1,
                          total: 1,
                        });
                        if (selectedWindow) setStep("confirm");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "20px 22px",
                        borderRadius: 16,
                        border: "2px solid var(--blue-200)",
                        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 13,
                            background:
                              "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                          }}
                        >
                          <Zap size={22} color="white" />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: "var(--blue-800)",
                              letterSpacing: "-0.01em",
                              marginBottom: 4,
                            }}
                          >
                            Get a Ticket Now
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--blue-600)",
                              lineHeight: 1.6,
                            }}
                          >
                            Skip time-slot selection. You'll be added to the{" "}
                            <strong>live queue immediately</strong> and served
                            in order of arrival.
                          </div>
                          <div
                            style={{
                              marginTop: 10,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: "white",
                              border: "1px solid var(--blue-200)",
                              borderRadius: 99,
                              padding: "4px 10px",
                              fontSize: 11,
                              color: "var(--blue-700)",
                              fontWeight: 600,
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
                            Walk-in · Proceeds to Confirm
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      className="mode-card"
                      onClick={() => setBookingMode("later")}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "20px 22px",
                        borderRadius: 16,
                        border: "2px solid var(--slate-200)",
                        background: "var(--slate-50)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 13,
                            background:
                              "linear-gradient(135deg, #475569, #334155)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: "0 4px 14px rgba(51,65,85,0.25)",
                          }}
                        >
                          <CalendarClock size={22} color="white" />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: "var(--slate-700)",
                              letterSpacing: "-0.01em",
                              marginBottom: 4,
                            }}
                          >
                            Schedule for Later Today
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--slate-500)",
                              lineHeight: 1.6,
                            }}
                          >
                            Pick a <strong>specific time slot</strong> later in
                            the day. Only remaining slots are shown.
                          </div>
                          <div
                            style={{
                              marginTop: 10,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: "white",
                              border: "1px solid var(--slate-200)",
                              borderRadius: 99,
                              padding: "4px 10px",
                              fontSize: 11,
                              color: "var(--slate-600)",
                              fontWeight: 600,
                            }}
                          >
                            <Clock size={10} /> Choose a time slot →
                          </div>
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
                      <ChevronLeft size={14} /> Back to options
                    </button>
                    {timeSlots.length === 0 ? (
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
                                          : "white",
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

                {selectedDate && selectedIsToday && bookingMode === "now" && (
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
                      <ChevronLeft size={14} /> Back to options
                    </button>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                        border: "1px solid var(--blue-200)",
                        borderRadius: 14,
                        padding: "18px 20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background:
                              "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Zap size={17} color="white" />
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "var(--blue-800)",
                          }}
                        >
                          Walk-in / Now selected
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--blue-700)",
                          lineHeight: 1.7,
                        }}
                      >
                        ⚠️ <strong>Almost done!</strong> Please select your
                        destination window above (if you haven't) and click{" "}
                        <strong>Continue to Confirm</strong> at the bottom of
                        the screen.
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          padding: "8px 12px",
                          background: "white",
                          borderRadius: 9,
                          border: "1px solid var(--blue-100)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Clock size={12} color="var(--blue-500)" />
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--blue-600)",
                            fontWeight: 600,
                          }}
                        >
                          Time Slot: Walk-in / Now
                        </span>
                      </div>
                    </div>
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
                                          : "white",
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
                      background: "#fef9c3",
                      border: "1px solid #fde68a",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "#92400e",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={13} color="#d97706" /> Please select a
                    window above first.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* CONFIRM VIEW                                           */}
        {/* ════════════════════════════════════════════════════════ */}
        {step === "confirm" && (
          <div
            className="slide-up"
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
                      {LOGGED_IN_USER.name
                        .split(" ")
                        .map((n) => n[0])
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
                      {LOGGED_IN_USER.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--slate-500)",
                        marginTop: 2,
                      }}
                    >
                      {LOGGED_IN_USER.course}
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
                  {[
                    { label: "Student ID", value: LOGGED_IN_USER.studentId },
                    { label: "Program", value: LOGGED_IN_USER.course },
                  ].map((f) => (
                    <div
                      key={f.label}
                      style={{
                        background: "white",
                        borderRadius: 10,
                        padding: "10px 12px",
                        border: "1px solid var(--blue-100)",
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
                          fontFamily:
                            f.label === "Student ID"
                              ? "'Space Mono',monospace"
                              : "inherit",
                        }}
                      >
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: "var(--slate-400)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Lock size={10} /> This information is tied to your student
                  account and cannot be changed here.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setStep("booking")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 11,
                    border: "1.5px solid var(--slate-200)",
                    background: "white",
                    color: "var(--slate-600)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleBook}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: 11,
                    border: "none",
                    background: "var(--blue-600)",
                    color: "white",
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
                  <Ticket size={15} /> Confirm & Get Ticket
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
                    value: `${MONTHS[selectedDate.month]} ${
                      selectedDate.day
                    }, ${selectedDate.year}`,
                    icon: CalendarDays,
                  },
                  { label: "Time", value: selectedSlot?.time, icon: Clock },
                  {
                    label: "Window",
                    value:
                      WINDOWS.find((w) => w.id === selectedWindow)?.label ||
                      "—",
                    icon: Users,
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
                    ~#5
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* TICKET VIEW                                            */}
        {/* ════════════════════════════════════════════════════════ */}
        {step === "ticket" && ticket && (
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
                <CheckCircle2 size={28} color="white" />
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 20,
                  color: "var(--slate-800)",
                  letterSpacing: "-0.02em",
                }}
              >
                Booking Confirmed!
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--slate-500)",
                  marginTop: 4,
                }}
              >
                Your appointment has been successfully registered.
              </div>
            </div>

            {ticketVisible && (
              <div
                className="ticket-appear ticket-shadow"
                style={{
                  width: "100%",
                  maxWidth: 420,
                  background: "white",
                  borderRadius: 22,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                    padding: "24px 28px 22px",
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
                      background: "rgba(255,255,255,0.05)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                        }}
                      >
                        ENROLLMENT TICKET
                      </div>
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 44,
                          fontWeight: 700,
                          color: "white",
                          lineHeight: 1,
                          marginTop: 4,
                        }}
                      >
                        {ticket.number}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: 14,
                        padding: "12px 16px",
                        textAlign: "center",
                      }}
                    >
                      <Ticket size={28} color="white" />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.6)",
                      marginTop: 8,
                    }}
                  >
                    {SCHOOL_NAME} · {DEPT}
                  </div>
                </div>
                {/* Tear line */}
                <div style={{ position: "relative", height: 0 }}>
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: -10,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--slate-100)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      right: -10,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--slate-100)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: -1,
                      left: 12,
                      right: 12,
                      borderTop: "2px dashed var(--slate-200)",
                    }}
                  />
                </div>
                <div style={{ padding: "28px 28px 24px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 18,
                      marginBottom: 20,
                    }}
                  >
                    {[
                      { label: "Name", value: ticket.name },
                      { label: "Student ID", value: ticket.id, mono: true },
                      { label: "Date", value: ticket.date },
                      { label: "Time", value: ticket.time },
                      { label: "Program", value: ticket.course },
                      { label: "Window", value: ticket.window },
                    ].map((field) => (
                      <div key={field.label}>
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
                          }}
                        >
                          {field.value}
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
                  {/* Queue position */}
                  <div
                    style={{
                      background: "var(--blue-50)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginBottom: 20,
                      border: "1px solid var(--blue-100)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Users size={14} color="var(--blue-600)" />
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--blue-700)",
                          fontWeight: 500,
                        }}
                      >
                        {queuePosition === null ? (
                          <>
                            Your ticket is <strong>{ticket.number}</strong>.
                            Please arrive 10 minutes before your slot.
                          </>
                        ) : queuePosition === 0 ? (
                          <>
                            <strong>You are next!</strong> Please proceed to
                            your window immediately.
                          </>
                        ) : (
                          <>
                            You are <strong>#{queuePosition}</strong> in the
                            live queue. Stay nearby and watch for your turn.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
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
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{
                        flex: 1,
                        padding: "11px",
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
                      <Download size={14} /> Save
                    </button>
                    <button
                      style={{
                        flex: 1,
                        padding: "11px",
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
                      <Share2 size={14} /> Share
                    </button>
                    <button
                      className="btn-primary"
                      onClick={reset}
                      style={{
                        flex: 2,
                        padding: "11px",
                        borderRadius: 10,
                        border: "none",
                        background: "var(--blue-600)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 20px",
          fontSize: 11,
          color: "var(--slate-400)",
          borderTop: "1px solid rgba(226,232,240,0.5)",
        }}
      >
        © 2025 {SCHOOL_NAME} · Enrollment Queueing System · All rights reserved
      </div>

      {/* ── "IT'S YOUR TURN" FULL-SCREEN ALERT ─────────────────── */}
      {isYourTurn && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(5, 46, 22, 0.96)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            animation: "backdropIn 0.3s ease",
          }}
        >
          <style>{`@keyframes backdropIn{from{opacity:0;}to{opacity:1;}}`}</style>
          <div
            className="your-turn-modal"
            style={{
              background: "linear-gradient(145deg, #052e16, #14532d)",
              border: "2px solid rgba(74,222,128,0.5)",
              borderRadius: 28,
              padding: "48px 40px",
              maxWidth: 460,
              width: "90%",
              textAlign: "center",
              boxShadow:
                "0 0 80px rgba(34,197,94,0.35), 0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="your-turn-pulse"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.2)",
                border: "2px solid rgba(34,197,94,0.4)",
                marginBottom: 24,
              }}
            >
              <BellRing size={44} color="#4ade80" className="bell-shake" />
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#86efac",
                marginBottom: 12,
              }}
            >
              {SCHOOL_NAME.toUpperCase()} · ENROLLMENT QUEUE
            </div>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 36,
                fontWeight: 900,
                color: "white",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 8,
              }}
            >
              IT IS YOUR TURN
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 48,
                fontWeight: 700,
                color: "#4ade80",
                letterSpacing: "0.04em",
                margin: "16px 0",
                textShadow: "0 0 32px rgba(74,222,128,0.6)",
              }}
            >
              {ticket?.number}
            </div>
            <div
              style={{
                fontSize: 15,
                color: "#bbf7d0",
                lineHeight: 1.7,
                marginBottom: 8,
              }}
            >
              Please proceed to
              <br />
              <strong style={{ color: "white", fontSize: 17 }}>
                {ticket?.window}
              </strong>
            </div>
            <div style={{ fontSize: 12, color: "#86efac", marginBottom: 32 }}>
              <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />
              {VENUE}
            </div>
            <button
              onClick={() => setIsYourTurn(false)}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 16,
                border: "2px solid rgba(74,222,128,0.5)",
                background: "rgba(34,197,94,0.15)",
                color: "#4ade80",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: "0.02em",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(34,197,94,0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(34,197,94,0.15)";
                e.currentTarget.style.transform = "none";
              }}
            >
              ✓ Got it — I'm on my way
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
