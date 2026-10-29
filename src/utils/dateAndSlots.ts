import {
  SLOT_CAPACITY,
  MONTHS,
  type AppTicket,
  type WindowStatus,
} from "../types/booking";

export const buildTimeSlots = (
  isToday: boolean,
  bookings: Record<string, number> = {}
) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const allSlots = [
    { id: 1, time: "8:00 AM", hour: 8, minute: 0 },
    { id: 2, time: "8:30 AM", hour: 8, minute: 30 },
    { id: 3, time: "9:00 AM", hour: 9, minute: 0 },
    { id: 4, time: "9:30 AM", hour: 9, minute: 30 },
    { id: 5, time: "10:00 AM", hour: 10, minute: 0 },
    { id: 6, time: "10:30 AM", hour: 10, minute: 30 },
    { id: 7, time: "11:00 AM", hour: 11, minute: 0 },
    { id: 8, time: "1:00 PM", hour: 13, minute: 0 },
    { id: 9, time: "1:30 PM", hour: 13, minute: 30 },
    { id: 10, time: "2:00 PM", hour: 14, minute: 0 },
    { id: 11, time: "2:30 PM", hour: 14, minute: 30 },
    { id: 12, time: "3:00 PM", hour: 15, minute: 0 },
  ].map((slot) => ({
    ...slot,
    total: SLOT_CAPACITY,
    // Live availability: CAPACITY minus booked count for this time slot
    available: Math.max(0, SLOT_CAPACITY - (bookings[slot.time] ?? 0)),
  }));

  if (!isToday) return allSlots;

  return allSlots.filter((slot) => {
    const slotTotalMinutes = slot.hour * 60 + slot.minute;
    const nowTotalMinutes = currentHour * 60 + currentMinute;
    return slotTotalMinutes > nowTotalMinutes + 30;
  });
};

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export const getLocalTodayDateStr = (): string => {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const dy = String(now.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
};

export function isTicketToday(t: AppTicket | null): boolean {
  if (!t) return false;
  if (t.date === "Today") return true;
  const appt = t.appointment_time || "";
  if (appt) {
    if (!appt.includes("T")) return true;
    const todayStr = getLocalTodayDateStr();
    return appt.split("T")[0] <= todayStr;
  }
  if (t.date && t.date.includes(",")) {
    const todayFormatted = `${MONTHS[new Date().getMonth()]} ${new Date().getDate()}, ${new Date().getFullYear()}`;
    return t.date === todayFormatted;
  }
  return true;
}

// ── Notice Board Independent Card Theming Factory ───────────
export const getNoticeForWindow = (
  windowName: string,
  status: WindowStatus
) => {
  if (status === "closed") {
    return {
      bg: "linear-gradient(135deg, #fef2f2, #fee2e2)",
      border: "#fca5a5",
      iconColor: "#dc2626",
      titleColor: "#991b1b",
      textColor: "#7f1d1d",
      title: `${windowName} is Closed`,
      text: "This window is currently closed for the day. Please check back later.",
    };
  } else if (status === "cutoff") {
    return {
      bg: "linear-gradient(135deg, #fffbeb, #fef3c7)",
      border: "#fde68a",
      iconColor: "#d97706",
      titleColor: "#92400e",
      textColor: "#78350f",
      title: `${windowName} Cut-off Active`,
      text: "We are nearing capacity. Only pre-booked slots are currently being accepted for this window.",
    };
  } else {
    return {
      bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
      border: "#bbf7d0",
      iconColor: "#16a34a",
      titleColor: "#166534",
      textColor: "#14532d",
      title: `${windowName} is Open`,
      text: "Standard operations are ongoing. Pre-book your slot or walk in to get a ticket.",
    };
  }
};
