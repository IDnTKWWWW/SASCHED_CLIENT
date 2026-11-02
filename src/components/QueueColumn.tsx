import type React from "react";
import type { QueueItem } from "../types/booking";
import type { QueueDisplayMode } from "../settings/types";
import { formatQueueDisplayName } from "../utils/formatQueueDisplayName";

export interface QueueColumnProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  nowServingTicket: string | null;
  queue: QueueItem[];
  pulseQueue: boolean;
  currentUserId?: string;
  currentUserTicketNumber?: string | null;
  currentUserDisplayMode?: QueueDisplayMode;
}

export default function QueueColumn({
  title,
  icon,
  accentColor,
  nowServingTicket,
  queue,
  pulseQueue,
  currentUserId,
  currentUserTicketNumber,
  currentUserDisplayMode,
}: QueueColumnProps) {
  return (
    <div
      className="card-shadow interactive-card"
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
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--slate-700)" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--green-600)", fontWeight: 600 }} />
      </div>
      {/* Now Serving row */}
      <div style={{ padding: "10px 20px", background: accentColor + "08", borderBottom: "1px solid var(--slate-100)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, letterSpacing: "0.07em", marginBottom: 4 }}>
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
            <span style={{ fontSize: 10, fontWeight: 700, color: accentColor, background: accentColor + "18", border: `1px solid ${accentColor}30`, borderRadius: 99, padding: "3px 9px" }}>
              AT WINDOW
            </span>
          )}
          {!nowServingTicket && (
            <span style={{ fontSize: 11, color: "var(--slate-400)" }}>Window is ready</span>
          )}
        </div>
      </div>
      {/* Queue rows */}
      <div style={{ padding: "6px 0", maxHeight: 220, overflowY: "auto" }}>
        {queue.length === 0 ? (
          <div style={{ padding: "18px 20px", fontSize: 13, color: "var(--slate-400)", textAlign: "center" }}>
            No users waiting.
          </div>
        ) : (
          queue.map((q: QueueItem, i: number) => {
            const isOwnRow = Boolean(
              (currentUserId && q.account_id && q.account_id === currentUserId) ||
                (currentUserTicketNumber && q.ticket_number === currentUserTicketNumber)
            );
            const renderedName = isOwnRow && currentUserDisplayMode
              ? formatQueueDisplayName(q.user_name, currentUserDisplayMode)
              : q.public_display_name || q.user_name;

            return (
              <div
                key={q.ticket_number}
                className="queue-item"
                style={{
                  padding: "9px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderLeft: isOwnRow ? `3px solid ${accentColor}` : "3px solid transparent",
                  background: isOwnRow ? `${accentColor}08` : "transparent",
                }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: isOwnRow ? accentColor : "var(--slate-400)", minWidth: 46 }}>
                  {q.ticket_number}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: isOwnRow ? 700 : 500, color: "var(--slate-700)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{renderedName}</span>
                    {isOwnRow && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: accentColor,
                          background: `${accentColor}16`,
                          border: `1px solid ${accentColor}30`,
                          borderRadius: 99,
                          padding: "1px 6px",
                        }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--slate-400)" }}>
                    {/* Strip date prefix if present (future bookings store "YYYY-MM-DDThh:mm AM") */}
                    {q.appointment_time?.includes("T") ? q.appointment_time.split("T")[1] : q.appointment_time}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "var(--slate-400)", fontWeight: 500 }}>#{i + 1}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

