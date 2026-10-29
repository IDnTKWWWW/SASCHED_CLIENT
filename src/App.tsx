import { useState, useEffect, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import StudentLogin from "./StudentLogin";
import QRCode from "qrcode";
import { IconContext } from "@phosphor-icons/react";
import "./index.css";
import "./styles/app.css";
import SettingsModal from "./settings/SettingsModal";
import { useUserSettings } from "./settings/useUserSettings";
import type { SettingsTab } from "./settings/types";
import { formatQueueDisplayName } from "./utils/formatQueueDisplayName";
import {
  SCHOOL_NAME,
  VENUE,
  BOOKING_WINDOW_DAYS,
  WINDOWS,
  MONTHS,
  HERO_WORDS,
  type AppTicket,
  type CurrentUser,
  type PurposeOfVisit,
  type SelectedDate,
  type SelectedSlot,
  type BookingStep,
  type BookingMode,
} from "./types/booking";
import {
  buildTimeSlots,
  getDaysInMonth,
  getFirstDayOfMonth,
  getLocalTodayDateStr,
} from "./utils/dateAndSlots";
import { playTurnChime } from "./utils/notifications";
import { useVantaWaves } from "./hooks/useVantaWaves";
import { useQueueRealtime } from "./hooks/useQueueRealtime";
import Header from "./components/Header";
import StepIndicator from "./components/StepIndicator";
import HomeView from "./components/views/HomeView";
import BookingView from "./components/views/BookingView";
import ConfirmView from "./components/views/ConfirmView";
import TicketView from "./components/views/TicketView";
import YourTurnModal from "./components/modals/YourTurnModal";
import SessionEndedModal from "./components/modals/SessionEndedModal";
import CancelConfirmModal from "./components/modals/CancelConfirmModal";
import HistoryModal from "./components/modals/HistoryModal";
import PasswordResetModal from "./components/modals/PasswordResetModal";
import ToastBanner from "./components/modals/ToastBanner";

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Animation State ────────────────────────────────────────────────────────
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroWordIndex((p) => (p + 1) % HERO_WORDS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const heroParticles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      top: `${Math.random() * 95}%`,
      left: `${Math.random() * 98}%`,
      size: i % 7 === 0 ? 6.5 : i % 3 === 0 ? 4.5 : i % 2 === 0 ? 3.5 : 2.5,
      duration: 3.5 + (i % 6) * 1.2,
      delay: (i % 8) * 0.35,
      driftX: (i % 2 === 0 ? 1 : -1) * (12 + (i % 16)),
      driftY: -20 - (i % 25),
      glow: i % 2 === 0,
      color: i % 4 === 0 ? "#bfdbfe" : i % 3 === 0 ? "#e0f2fe" : "#ffffff",
    }));
  }, []);

  // ── Auth State ───────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [customFullName, setCustomFullName] = useState<string | null>(null);

  // ── User Profile & Settings State ────────────────────────────
  const {
    settings,
    saving: settingsSaving,
    saveSettings,
  } = useUserSettings(session?.user?.id ?? "");
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>("profile");

  const openSettingsAtTab = (tab: SettingsTab = "profile") => {
    setSettingsInitialTab(tab);
    setShowSettingsModal(true);
  };

  // ── Vanta Background State ──────────────────────────────────────────────
  const vantaRef = useVantaWaves(settings.reduceMotion);

  // ── Booking State ────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [bookingMode, setBookingMode] = useState<BookingMode>(null);
  const [step, setStep] = useState<BookingStep>("home");
  const [ticket, setTicket] = useState<AppTicket | null>(null);
  const [ticketVisible, setTicketVisible] = useState<boolean>(false);
  const [pulseQueue, setPulseQueue] = useState<boolean>(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isYourTurn, setIsYourTurn] = useState<boolean>(false);
  // ── Session-ended in-app modal ───────────────────────────────────
  const [sessionEndedStatus, setSessionEndedStatus] = useState<string | null>(null);
  // ── Cancel appointment confirmation ──────────────────────────────
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  // ── Share / clipboard copy feedback ──────────────────────────────
  const [ticketNumCopied, setTicketNumCopied] = useState<boolean>(false);
  const [testingChime, setTestingChime] = useState<boolean>(false);

  // ── 1-Ticket Policy State ────────────────────────────────────
  const [hasActiveTicket, setHasActiveTicket] = useState<boolean>(false);

  // ── Cancel Loading State ─────────────────────────────────────
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  // ── Toast Notification State ───────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string, durationMs = 5000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), durationMs);
  };

  // ── Purpose of Visit (per-booking selection) ──────────────────────────────
  const [purposeOfVisit, setPurposeOfVisit] =
    useState<PurposeOfVisit>("General");

  // ── Booking Submit State ─────────────────────────────────────
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // ── Live Slot Availability ────────────────────────────────────
  // Maps slot time (e.g. "9:00 AM") → number of existing booked tickets
  const [slotBookings, setSlotBookings] = useState<Record<string, number>>({});
  const [slotLoading, setSlotLoading] = useState<boolean>(false);

  const handleTestChime = () => {
    playTurnChime();
    setTestingChime(true);
    setTimeout(() => setTestingChime(false), 1600);
    showToast("Playing 3-tone queue notification chime");
  };

  const handleCopyTicketNumber = (num: string) => {
    try {
      navigator.clipboard?.writeText(num);
      setTicketNumCopied(true);
      setTimeout(() => setTicketNumCopied(false), 2000);
      showToast(`Ticket ${num} copied to clipboard`);
    } catch (_) {
      showToast(`Ticket: ${num}`);
    }
  };

  // ── QR Code State ────────────────────────────────────────────
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  useEffect(() => {
    if (ticket?.number) {
      QRCode.toDataURL(ticket.number, {
        width: 140,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => {
          if (import.meta.env.DEV) console.warn("[DEV] QR error:", err);
        });
    } else {
      setQrCodeUrl("");
    }
  }, [ticket?.number]);

  // ── Password Reset State ─────────────────────────────────────
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);

  // ── Student Appointment History State ────────────────────────
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Fetch real booking counts for the selected date+window from Supabase
  const fetchSlotBookings = async (date: typeof selectedDate, windowId: string | null) => {
    if (!date || !windowId) {
      setSlotBookings({});
      return;
    }
    setSlotLoading(true);
    try {
      const windowObj = WINDOWS.find((w) => w.id === windowId);
      const department = windowObj?.dept || "Cashier";

      // Build the date prefix "YYYY-MM-DD" to match appointment_time format
      const datePrefix = `${date.year}-${String(date.month + 1).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
      const isDateToday =
        date.day === new Date().getDate() &&
        date.month === new Date().getMonth() &&
        date.year === new Date().getFullYear();

      // Filter by department (Cashier | Registrar) for robust cross-table alignment
      let query = supabase
        .from("queue_tickets")
        .select("appointment_time")
        .in("status", ["waiting", "serving"])
        .eq("department", department);

      if (isDateToday) {
        // Today: count same-day untagged rows AND advance bookings scheduled for today ("YYYY-MM-DDThh:mm AM")
        const { data } = await query;
        const counts: Record<string, number> = {};
        (data || []).forEach((row: Record<string, string>) => {
          const t = row.appointment_time || "";
          if (!t.includes("T")) {
            counts[t] = (counts[t] ?? 0) + 1;
          } else if (t.startsWith(datePrefix + "T")) {
            const timeOnly = t.split("T")[1];
            counts[timeOnly] = (counts[timeOnly] ?? 0) + 1;
          }
        });
        setSlotBookings(counts);
      } else {
        // Future date: appointment_time is "YYYY-MM-DDThh:mm AM"
        // Filter by rows that start with this date prefix
        const { data } = await query;
        const counts: Record<string, number> = {};
        (data || []).forEach((row: Record<string, string>) => {
          const t = row.appointment_time || "";
          if (t.startsWith(datePrefix + "T")) {
            const timeOnly = t.split("T")[1]; // e.g. "9:00 AM"
            counts[timeOnly] = (counts[timeOnly] ?? 0) + 1;
          }
        });
        setSlotBookings(counts);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("[DEV] fetchSlotBookings error:", e);
      setSlotBookings({});
    } finally {
      setSlotLoading(false);
    }
  };

  // Re-fetch slot availability whenever date or window changes
  useEffect(() => {
    fetchSlotBookings(selectedDate, selectedWindow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedWindow]);

  // ── Auth Gatekeeper ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "PASSWORD_RECOVERY") {
        setIsResettingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Logout ───────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ── Derive user identity from session ───────────────────────
  // Use immutable session.user.id (UUID) as the canonical accountId —
  // never parse identity from the email string (anti-spoofing).
  const displayName: string =
    (customFullName ?? "").trim() ||
    ((session?.user?.user_metadata?.display_name as string | undefined) ?? "")
      .trim() ||
    "SASCHED User";

  const currentUser: CurrentUser = {
    name: displayName,
    accountId: session?.user?.id ?? "",
    email: session?.user?.email ?? "",
  };

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("queue_tickets")
        .select("*")
        .eq("account_id", currentUser.accountId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) {
        setHistoryList(data);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("[DEV] History fetch error:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Pulse animation ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseQueue(true);
      setTimeout(() => setPulseQueue(false), 1000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch & Realtime Sync ────────────────────────────────────
  const {
    cashierStatus,
    registrarStatus,
    nowServingCashier,
    nowServingRegistrar,
    cashierQueue,
    registrarQueue,
    liveQueueCount,
    resetAlertedThreshold,
  } = useQueueRealtime({
    session,
    accountId: currentUser.accountId,
    ticket,
    settings,
    showToast,
    setTicket,
    setHasActiveTicket,
    setIsYourTurn,
    setQueuePosition,
    setSessionEndedStatus,
    setStep,
  });

  // ── Date helpers ─────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const isPast = (day: number) => new Date(currentYear, currentMonth, day) < today;
  const isBeyondWindow = (day: number) => {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + BOOKING_WINDOW_DAYS);
    return new Date(currentYear, currentMonth, day) > cutoff;
  };
  // Bug fix: block BOTH Sunday (0) AND Saturday (6) — office is Mon–Fri only
  const isWeekend = (day: number) => {
    const dow = new Date(currentYear, currentMonth, day).getDay();
    return dow === 0 || dow === 6;
  };
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();
  const isDisabled = (day: number) =>
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

  const timeSlots = buildTimeSlots(selectedIsToday, slotBookings);

  // ── Live Lockout Logic Gateway ───────────────────────────────
  const activeWindowStatus =
    selectedWindow === "cashier"
      ? cashierStatus
      : selectedWindow === "registrar"
        ? registrarStatus
        : "open";
  const walkinDisabled =
    !selectedWindow ||
    activeWindowStatus === "cutoff" ||
    activeWindowStatus === "closed";
  const laterTodayDisabled = !selectedWindow || activeWindowStatus === "closed";

  // ── Booking Operation ────────────────────────────────────────
  const handleBook = async () => {
    const isDateToday =
      selectedDate!.day === today.getDate() &&
      selectedDate!.month === today.getMonth() &&
      selectedDate!.year === today.getFullYear();

    if (isDateToday && activeWindowStatus === "closed") {
      setBookingError("This window is currently closed today. Please select another window or a different date.");
      return;
    }

    if (hasActiveTicket) {
      setBookingError(
        "You already have an active appointment. Please complete or cancel it first."
      );
      return;
    }
    if (bookingLoading) return;
    setBookingError(null);
    setBookingLoading(true);

    const windowObj = WINDOWS.find((w) => w.id === selectedWindow);
    const windowLabel = windowObj?.label || "—";
    const department = windowObj?.dept || "Cashier";

    // Generate short memorable ticket: PREFIX-XXX (e.g. C-001, C-002, R-001)
    const prefix = department.charAt(0).toUpperCase();
    let num = `${prefix}-001`;
    try {
      const todayStr = getLocalTodayDateStr();
      const { data: deptTickets } = await supabase
        .from("queue_tickets")
        .select("ticket_number, created_at, appointment_time")
        .ilike("ticket_number", `${prefix}-%`)
        .limit(1000);

      const usedNumbers = new Set(deptTickets?.map((r) => r.ticket_number) || []);
      let maxSeq = 0;
      if (deptTickets) {
        for (const row of deptTickets) {
          const isTodayRow =
            (row.created_at && row.created_at.startsWith(todayStr)) ||
            (row.appointment_time && row.appointment_time.startsWith(todayStr));
          if (isTodayRow) {
            const match = row.ticket_number?.match(new RegExp(`^${prefix}-(\\d{3,4})$`));
            if (match) {
              const val = parseInt(match[1], 10);
              if (val > maxSeq) maxSeq = val;
            }
          }
        }
      }

      let candidateSeq = maxSeq + 1;
      let candidate = `${prefix}-${String(candidateSeq).padStart(3, "0")}`;
      while (usedNumbers.has(candidate)) {
        candidateSeq++;
        candidate = `${prefix}-${String(candidateSeq).padStart(3, "0")}`;
      }
      num = candidate;
    } catch (_) {
      const fallbackSeq = Math.floor(1 + Math.random() * 999);
      num = `${prefix}-${String(fallbackSeq).padStart(3, "0")}`;
    }

    // Encode the selected date into appointment_time for future bookings.
    // Format: "YYYY-MM-DDThh:mm AM" — admin side detects the "T" to know it's future.
    // Today's bookings stay as plain time strings ("9:00 AM") for backward compat.
    // Walk-in bookings record the actual current clock time.
    const rawSlotTime = selectedSlot!.time;
    const isWalkin = rawSlotTime.startsWith("Walk-in") || bookingMode === "now";
    const now = new Date();
    const walkinTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const slotTime = isWalkin ? walkinTime : rawSlotTime;
    const datePrefix = `${selectedDate!.year}-${String(selectedDate!.month + 1).padStart(2, "0")}-${String(selectedDate!.day).padStart(2, "0")}`;
    const appointmentTimeValue = isDateToday ? slotTime : `${datePrefix}T${slotTime}`;

    // Request browser notification permission only if user enabled browser notifications in Settings
    if (
      settings.browserNotifications &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        Notification.requestPermission();
      } catch (_) {}
    }

    const publicDisplayName = formatQueueDisplayName(
      currentUser.name,
      settings.queueDisplayMode
    );

    const basePayload = {
      ticket_number: num,
      user_name: currentUser.name,
      account_id: currentUser.accountId,
      service_type: purposeOfVisit,
      destination_window: windowLabel,
      department: department,
      appointment_time: appointmentTimeValue,
      status: "waiting",
      booking_type: isWalkin ? "walkin" : "booked",
    };

    // Save to Supabase (includes public_display_name, with automatic fallback if column not migrated yet)
    let { error } = await supabase.from("queue_tickets").insert([
      {
        ...basePayload,
        public_display_name: publicDisplayName,
      },
    ]);

    if (
      error &&
      (error.code === "PGRST204" ||
        (error.message || "").toLowerCase().includes("public_display_name"))
    ) {
      const retry = await supabase.from("queue_tickets").insert([basePayload]);
      error = retry.error;
    }

    setBookingLoading(false);

    if (error) {
      if (import.meta.env.DEV) {
        console.warn("[DEV] Ticket insert error:", error);
      }
      setBookingError(`Booking failed: ${error.message}`);
      return;
    }

    resetAlertedThreshold();
    setHasActiveTicket(true);
    setTicket({
      number: num,
      date: isDateToday
        ? "Today"
        : `${MONTHS[selectedDate!.month]} ${selectedDate!.day}, ${selectedDate!.year}`,
      time: slotTime,
      name: currentUser.name,
      id: currentUser.accountId,
      service_type: purposeOfVisit,
      window: windowLabel,
      venue: VENUE,
      issued: new Date().toLocaleString(),
      appointment_time: appointmentTimeValue,
      department: department,
    });
    setStep("ticket");
    setTimeout(() => setTicketVisible(true), 100);
    // Refresh slot counts so the counts stay accurate for others browsing
    fetchSlotBookings(selectedDate, selectedWindow);
  };


  // ── Save ticket as print / PDF ────────────────────────────────────
  const handleSave = () => {
    window.print();
  };

  // ── Cancel active ticket ─────────────────────────────────────────
  const handleCancelTicket = async () => {
    if (!ticket || cancelLoading) return;
    setCancelLoading(true);

    try {
      // Update status to "removed" — RLS blocks hard deletes and admin logs depend on this record
      const { error } = await supabase
        .from("queue_tickets")
        .update({ status: "removed" })
        .eq("ticket_number", ticket.number);

      if (error) {
        if (import.meta.env.DEV) console.warn("[DEV] Cancel ticket update error:", error);
        showToast(`Failed to cancel ticket: ${error.message}`);
        return;
      }

      // Only clear local state upon verified DB success
      setShowCancelConfirm(false);
      setHasActiveTicket(false);
      setTicket(null);
      setIsYourTurn(false);
      setStep("home");
      setPurposeOfVisit("General");
      showToast("Ticket successfully cancelled.");
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[DEV] Cancel ticket exception:", err);
      showToast("Network error: Could not cancel ticket. Please retry.");
    } finally {
      setCancelLoading(false);
    }
  };

  const reset = () => {
    if (hasActiveTicket) {
      showToast("You're still in the queue! Tap \"View Active Ticket\" to check your status.");
    }
    setStep("home");
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedWindow(null);
    setBookingMode(null);
    setTicketVisible(false);
    setPurposeOfVisit("General");
    setBookingError(null);
  };


  // ── Auth Loading Spinner ─────────────────────────────────────
  if (!authReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 40%, #f5f8ff 100%)",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          @keyframes spinAuth { to { transform: rotate(360deg); } }
        `}</style>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3.5px solid rgba(37,99,235,0.15)",
            borderTop: "3.5px solid #2563eb",
            borderRadius: "50%",
            animation: "spinAuth 0.75s linear infinite",
          }}
        />
      </div>
    );
  }

  // ── Gate: show login if no session ──────────────────────────
  if (!session) {
    return <StudentLogin onLoginSuccess={() => { }} />;
  }

  // ── Authenticated App ────────────────────────────────────────
  return (
    <IconContext.Provider value={{ weight: "duotone" }}>
      <div
        style={{
          fontFamily: "'Outfit', 'DM Sans', sans-serif",
          minHeight: "100vh",
          position: "relative",
          background: "linear-gradient(160deg, #f8fafc 0%, #eef5ff 50%, #e0edfc 100%)", // fallback if Vanta fails
        }}
      >
        {/* Vanta Waves Background — fixed so it covers whole viewport */}
        <div
          ref={vantaRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            display: settings.reduceMotion ? "none" : "block",
          }}
        />
        {/* ── HEADER ──────────────────────────────────────────────── */}
        <Header
          currentUser={currentUser}
          settings={settings}
          onOpenSettings={openSettingsAtTab}
          onOpenHistory={openHistoryModal}
          onLogout={handleLogout}
        />

        <main
          style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 10 }}
        >
          {/* ── STEP INDICATOR ──────────────────────────────────────── */}
          <StepIndicator
            step={step}
            setStep={setStep}
            bookingLoading={bookingLoading}
            setSelectedWindow={setSelectedWindow}
            setSelectedDate={setSelectedDate}
            setSelectedSlot={setSelectedSlot}
            setBookingMode={setBookingMode}
            setPurposeOfVisit={setPurposeOfVisit}
            setBookingError={setBookingError}
          />

          {/* ════════════════════════════════════════════════════════ */}
          {/* HOME VIEW                                              */}
          {/* ════════════════════════════════════════════════════════ */}
          {step === "home" && (
            <HomeView
              heroParticles={heroParticles}
              heroWordIndex={heroWordIndex}
              hasActiveTicket={hasActiveTicket}
              setStep={setStep}
              setTicketVisible={setTicketVisible}
              liveQueueCount={liveQueueCount}
              cashierQueue={cashierQueue}
              registrarQueue={registrarQueue}
              nowServingCashier={nowServingCashier}
              nowServingRegistrar={nowServingRegistrar}
              pulseQueue={pulseQueue}
              currentUser={currentUser}
              ticket={ticket}
              settings={settings}
              cashierStatus={cashierStatus}
              registrarStatus={registrarStatus}
            />
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/* BOOKING VIEW                                           */}
          {/* ════════════════════════════════════════════════════════ */}
          {step === "booking" && (
            <BookingView
              selectedWindow={selectedWindow}
              setSelectedWindow={setSelectedWindow}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              bookingMode={bookingMode}
              setBookingMode={setBookingMode}
              cashierStatus={cashierStatus}
              registrarStatus={registrarStatus}
              cashierQueue={cashierQueue}
              registrarQueue={registrarQueue}
              currentMonth={currentMonth}
              currentYear={currentYear}
              prevMonth={prevMonth}
              nextMonth={nextMonth}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              firstDay={firstDay}
              daysInMonth={daysInMonth}
              isDisabled={isDisabled}
              isToday={isToday}
              selectedIsToday={selectedIsToday}
              walkinDisabled={walkinDisabled}
              laterTodayDisabled={laterTodayDisabled}
              activeWindowStatus={activeWindowStatus}
              slotLoading={slotLoading}
              timeSlots={timeSlots}
              setStep={setStep}
            />
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/* CONFIRM VIEW                                           */}
          {/* ════════════════════════════════════════════════════════ */}
          {step === "confirm" && (
            <ConfirmView
              currentUser={currentUser}
              purposeOfVisit={purposeOfVisit}
              setPurposeOfVisit={setPurposeOfVisit}
              bookingError={bookingError}
              bookingLoading={bookingLoading}
              setStep={setStep}
              handleBook={handleBook}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              selectedWindow={selectedWindow}
              cashierQueue={cashierQueue}
              registrarQueue={registrarQueue}
            />
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/* TICKET VIEW                                            */}
          {/* ════════════════════════════════════════════════════════ */}
          {step === "ticket" && ticket && (
            <TicketView
              ticket={ticket}
              hasActiveTicket={hasActiveTicket}
              ticketVisible={ticketVisible}
              ticketNumCopied={ticketNumCopied}
              qrCodeUrl={qrCodeUrl}
              queuePosition={queuePosition}
              testingChime={testingChime}
              setShowCancelConfirm={setShowCancelConfirm}
              handleCopyTicketNumber={handleCopyTicketNumber}
              handleTestChime={handleTestChime}
              handleSave={handleSave}
              reset={reset}
            />
          )}
        </main>

        {/* Footer */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            padding: "18px 20px",
            fontSize: 11,
            color: "var(--slate-500)",
            borderTop: "1px solid rgba(226, 232, 240, 0.7)",
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          © 2025 {SCHOOL_NAME} · Universal Appointment Scheduler · All rights reserved
        </div>

        {/* ── "IT'S YOUR TURN" FULL-SCREEN ALERT ─────────────────── */}
        <YourTurnModal
          isYourTurn={isYourTurn}
          ticket={ticket}
          onDismiss={() => setIsYourTurn(false)}
        />

        {/* ── SESSION ENDED IN-APP MODAL (replaces native alert) ────── */}
        <SessionEndedModal
          sessionEndedStatus={sessionEndedStatus}
          onDismiss={() => setSessionEndedStatus(null)}
        />

        {/* ── CANCEL APPOINTMENT CONFIRM MODAL ────────────────────── */}
        <CancelConfirmModal
          isOpen={showCancelConfirm}
          ticket={ticket}
          onClose={() => setShowCancelConfirm(false)}
          onConfirmCancel={handleCancelTicket}
        />

        {/* ── STUDENT APPOINTMENT HISTORY MODAL ────────────────── */}
        <HistoryModal
          isOpen={showHistoryModal}
          currentUser={currentUser}
          historyLoading={historyLoading}
          historyList={historyList}
          onClose={() => setShowHistoryModal(false)}
          onCopyTicketNumber={handleCopyTicketNumber}
        />

        {/* ── PASSWORD RESET MODAL (recovering from email link) ──── */}
        <PasswordResetModal
          isOpen={isResettingPassword}
          onClose={() => setIsResettingPassword(false)}
          onSuccessToast={showToast}
        />

        {/* ── USER PROFILE & SETTINGS MODAL ──────────────────────── */}
        <SettingsModal
          isOpen={showSettingsModal}
          initialTab={settingsInitialTab}
          onClose={() => setShowSettingsModal(false)}
          userName={currentUser.name}
          userEmail={currentUser.email}
          activeTicketNumber={ticket?.number}
          settings={settings}
          saving={settingsSaving}
          onSave={saveSettings}
          onTestChime={handleTestChime}
          onShowToast={showToast}
          onFullNameUpdated={(name) => setCustomFullName(name)}
        />

        {/* ── TOAST NOTIFICATION ───────────────────────────────── */}
        <ToastBanner
          toastMessage={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      </div>
    </IconContext.Provider>
  );
}
