import { useState, useEffect, useRef } from "react";
import type React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import {
  VENUE,
  MONTHS,
  type AppTicket,
  type BookingStep,
  type QueueItem,
  type WindowStatus,
} from "../types/booking";
import { getLocalTodayDateStr, isTicketToday } from "../utils/dateAndSlots";
import { playTurnChime, notifyTurn } from "../utils/notifications";
import type { UserSettings } from "../settings/types";

export interface UseQueueRealtimeParams {
  session: Session | null;
  accountId: string;
  ticket: AppTicket | null;
  settings: UserSettings;
  showToast: (msg: string, durationMs?: number) => void;
  setTicket: React.Dispatch<React.SetStateAction<AppTicket | null>>;
  setHasActiveTicket: React.Dispatch<React.SetStateAction<boolean>>;
  setIsYourTurn: React.Dispatch<React.SetStateAction<boolean>>;
  setQueuePosition: React.Dispatch<React.SetStateAction<number | null>>;
  setSessionEndedStatus: React.Dispatch<React.SetStateAction<string | null>>;
  setStep: React.Dispatch<React.SetStateAction<BookingStep>>;
}

const isForToday = (appointmentTime?: string): boolean => {
  const t = appointmentTime || "";
  return !t.includes("T") || t.split("T")[0] <= getLocalTodayDateStr();
};

export function useQueueRealtime({
  session,
  accountId,
  ticket,
  settings,
  showToast,
  setTicket,
  setHasActiveTicket,
  setIsYourTurn,
  setQueuePosition,
  setSessionEndedStatus,
  setStep,
}: UseQueueRealtimeParams) {
  // ── Window Status State (Admin Controls) ──────────────────────
  const [cashierStatus, setCashierStatus] = useState<WindowStatus>("open");
  const [registrarStatus, setRegistrarStatus] = useState<WindowStatus>("open");

  // ── Split "Now Serving" per department ──────────────────────
  const [nowServingCashier, setNowServingCashier] = useState<string | null>(null);
  const [nowServingRegistrar, setNowServingRegistrar] = useState<string | null>(null);

  // ── Split live queue per department ─────────────────────────
  const [cashierQueue, setCashierQueue] = useState<QueueItem[]>([]);
  const [registrarQueue, setRegistrarQueue] = useState<QueueItem[]>([]);

  // ── Total across both departments ───────────────────────────
  const [liveQueueCount, setLiveQueueCount] = useState<number | null>(null);

  // ── Realtime Refs to prevent WebSocket disconnections ────────
  const ticketRef = useRef(ticket);
  useEffect(() => {
    ticketRef.current = ticket;
  }, [ticket]);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const alertedThresholdRef = useRef<string | null>(null);
  const resetAlertedThreshold = () => {
    alertedThresholdRef.current = null;
  };

  const checkThresholdAlert = (
    pos: number,
    ticketNum: string,
    windowLabel: string
  ) => {
    const threshold = settingsRef.current.alertThreshold;
    if (threshold > 0 && pos > 0 && pos <= threshold) {
      const alertKey = `${ticketNum}:threshold:${threshold}`;
      if (alertedThresholdRef.current !== alertKey) {
        alertedThresholdRef.current = alertKey;
        if (settingsRef.current.audioChimeEnabled) {
          playTurnChime();
        }
        if (
          settingsRef.current.browserNotifications &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification(`Almost Your Turn (#${pos} in line) — SASCHED`, {
              body: `Ticket ${ticketNum} is now #${pos} in line for ${windowLabel}. Please get ready!`,
              icon: "/logo.png",
            });
          } catch {
            // Ignore notification errors
          }
        }
        showToastRef.current(
          `Heads up! Ticket ${ticketNum} is now #${pos} in line for ${windowLabel}.`
        );
      }
    }
  };

  // ── Fetch & Realtime Sync ────────────────────────────────────
  useEffect(() => {
    const fetchInitial = async () => {
      if (!session) return;

      // 1. Check for User's Active Ticket (One-Ticket Policy)
      // Use order + limit(1) + maybeSingle() so duplicate active rows in test data never crash with PGRST116
      const { data: myTicketData } = await supabase
        .from("queue_tickets")
        .select("*")
        .eq("account_id", accountId)
        .in("status", ["waiting", "serving"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (myTicketData) {
        setHasActiveTicket(true);
        const rawApptTime: string = myTicketData.appointment_time || "";
        const todayStr = getLocalTodayDateStr();
        const hasT = rawApptTime.includes("T");
        const datePart = hasT ? rawApptTime.split("T")[0] : todayStr;
        const isToday = !hasT || datePart <= todayStr;

        const displayDate = (() => {
          if (isToday) return "Today";
          const [yr, mo, dy] = datePart.split("-").map(Number);
          return `${MONTHS[mo - 1]} ${dy}, ${yr}`;
        })();
        const displayTime = hasT ? rawApptTime.split("T")[1] : rawApptTime;

        setTicket({
          number: myTicketData.ticket_number,
          date: displayDate,
          time: displayTime,
          name: myTicketData.user_name,
          id: myTicketData.account_id,
          service_type: myTicketData.service_type,
          window: myTicketData.destination_window,
          venue: VENUE,
          issued: new Date(myTicketData.created_at).toLocaleString(),
          appointment_time: myTicketData.appointment_time,
          department: myTicketData.department,
        });
        // If serving, show alert
        if (myTicketData.status === "serving") {
          setIsYourTurn(true);
          setQueuePosition(0);
        }
      }

      // 2. Now Serving (Fetch both windows)
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

      // 3. Waiting Queue
      const {
        data: waitingData,
        error,
      } = await supabase
        .from("queue_tickets")
        .select("*", {
          count: "exact",
        })
        .eq("status", "waiting")
        .order("created_at", { ascending: true });

      if (error) {
        if (import.meta.env.DEV) {
          console.warn("[DEV] Queue fetch error:", error);
        }
      }

      if (waitingData) {
        // Only tickets scheduled for today belong in the live queue count and waiting line
        const todayWaiting = waitingData.filter((r) =>
          isForToday(r.appointment_time)
        );

        setCashierQueue(todayWaiting.filter((r) => r.department === "Cashier"));
        setRegistrarQueue(
          todayWaiting.filter((r) => r.department === "Registrar")
        );
        setLiveQueueCount(todayWaiting.length);

        // Find my position if I have a ticket for TODAY
        if (myTicketData && myTicketData.status === "waiting") {
          if (isForToday(myTicketData.appointment_time)) {
            const deptWaiting = todayWaiting.filter(
              (r) => r.department === myTicketData.department
            );
            const myIndex = deptWaiting.findIndex(
              (r) => r.ticket_number === myTicketData.ticket_number
            );
            const pos = myIndex === -1 ? 0 : myIndex + 1;
            setQueuePosition(pos);
            checkThresholdAlert(
              pos,
              myTicketData.ticket_number,
              myTicketData.destination_window || myTicketData.department
            );
          } else {
            setQueuePosition(null);
          }
        }
      }

      // 4. Window Statuses
      const { data: windowData } = await supabase
        .from("window_status")
        .select("cashier_status, registrar_status")
        .eq("id", 1)
        .single();

      if (windowData) {
        setCashierStatus(windowData.cashier_status || "open");
        setRegistrarStatus(windowData.registrar_status || "open");
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
          if (!isForToday(row.appointment_time)) return;

          const item: QueueItem = {
            ticket_number: row.ticket_number,
            user_name: row.user_name,
            public_display_name: row.public_display_name,
            account_id: row.account_id,
            appointment_time: row.appointment_time,
            department: row.department,
          };

          if (row.department === "Cashier") {
            setCashierQueue((prev) => {
              if (prev.some((r) => r.ticket_number === item.ticket_number)) return prev;
              setLiveQueueCount((c) => (c ?? 0) + 1);
              return [...prev, item];
            });
          } else if (row.department === "Registrar") {
            setRegistrarQueue((prev) => {
              if (prev.some((r) => r.ticket_number === item.ticket_number)) return prev;
              setLiveQueueCount((c) => (c ?? 0) + 1);
              return [...prev, item];
            });
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

          // If ticket was recalled, put back to waiting, or had its public_display_name updated
          if (row.status === "waiting") {
            const item: QueueItem = {
              ticket_number: row.ticket_number,
              user_name: row.user_name,
              public_display_name: row.public_display_name,
              account_id: row.account_id,
              appointment_time: row.appointment_time,
              department: row.department,
            };
            if (dept === "Cashier") {
              setCashierQueue((prev) => {
                if (prev.some((r) => r.ticket_number === row.ticket_number)) {
                  return prev.map((r) =>
                    r.ticket_number === row.ticket_number ? item : r
                  );
                }
                if (!isForToday(row.appointment_time)) return prev;
                setLiveQueueCount((c) => (c ?? 0) + 1);
                return [...prev, item];
              });
            } else if (dept === "Registrar") {
              setRegistrarQueue((prev) => {
                if (prev.some((r) => r.ticket_number === row.ticket_number)) {
                  return prev.map((r) =>
                    r.ticket_number === row.ticket_number ? item : r
                  );
                }
                if (!isForToday(row.appointment_time)) return prev;
                setLiveQueueCount((c) => (c ?? 0) + 1);
                return [...prev, item];
              });
            }
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

          // Check if it's YOUR turn or your ticket ended
          if (
            ticketRef.current &&
            row.ticket_number === ticketRef.current.number
          ) {
            if (row.status === "serving") {
              setIsYourTurn(true);
              setQueuePosition(0);
              if (settingsRef.current.audioChimeEnabled) {
                playTurnChime();
              }
              if (settingsRef.current.browserNotifications) {
                notifyTurn(row.ticket_number, row.destination_window || dept);
              }
            } else if (["served", "noshow", "removed", "cancelled"].includes(row.status)) {
              // Session concluded — show in-app modal instead of native alert
              setSessionEndedStatus(row.status);
              setHasActiveTicket(false);
              setTicket(null);
              setIsYourTurn(false);
              setStep("home");
              alertedThresholdRef.current = null;
            }
          }

          // Recalculate my queue position whenever a ticket ahead of me is removed or served
          if (ticketRef.current && ["serving", "removed", "served", "noshow"].includes(row.status)) {
            const fetchPosition = async () => {
              const { data, error: posErr } = await supabase
                .from("queue_tickets")
                .select("ticket_number, department, appointment_time")
                .eq("status", "waiting")
                .order("created_at", { ascending: true });

              if (!posErr && data && ticketRef.current) {
                if (isTicketToday(ticketRef.current)) {
                  const myDept =
                    ticketRef.current.department ||
                    (ticketRef.current.window?.includes("Registrar")
                      ? "Registrar"
                      : "Cashier");
                  const deptData = data.filter(
                    (r) =>
                      isForToday(r.appointment_time) && r.department === myDept
                  );
                  const myIndex = deptData.findIndex(
                    (r) => r.ticket_number === ticketRef.current!.number
                  );
                  const pos = myIndex === -1 ? 0 : myIndex + 1;
                  setQueuePosition(pos);
                  checkThresholdAlert(
                    pos,
                    ticketRef.current.number,
                    ticketRef.current.window || myDept
                  );
                } else {
                  setQueuePosition(null);
                }
              }
            };
            fetchPosition();
          }
        }
      )
      // Window Status changed (Admin triggered)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "window_status" },
        (payload) => {
          const row = payload.new;
          if (row.id === 1) {
            if (row.cashier_status) setCashierStatus(row.cashier_status);
            if (row.registrar_status) setRegistrarStatus(row.registrar_status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, accountId]);

  return {
    cashierStatus,
    registrarStatus,
    nowServingCashier,
    nowServingRegistrar,
    cashierQueue,
    registrarQueue,
    liveQueueCount,
    resetAlertedThreshold,
  };
}
