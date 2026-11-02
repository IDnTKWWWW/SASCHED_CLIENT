import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ArrowRight,
  Users,
  WarningCircle,
  MapPin,
} from "@phosphor-icons/react";
import QueueColumn from "../QueueColumn";
import {
  HERO_WORDS,
  VENUE,
  SCHOOL_NAME,
  type AppTicket,
  type BookingStep,
  type CurrentUser,
  type QueueItem,
  type WindowStatus,
} from "../../types/booking";
import { getNoticeForWindow } from "../../utils/dateAndSlots";
import type { UserSettings } from "../../settings/types";

export interface HeroParticle {
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  glow: boolean;
  color: string;
}

export interface HomeViewProps {
  heroParticles: HeroParticle[];
  heroWordIndex: number;
  hasActiveTicket: boolean;
  setStep: React.Dispatch<React.SetStateAction<BookingStep>>;
  setTicketVisible: React.Dispatch<React.SetStateAction<boolean>>;
  liveQueueCount: number | null;
  cashierQueue: QueueItem[];
  registrarQueue: QueueItem[];
  nowServingCashier: string | null;
  nowServingRegistrar: string | null;
  pulseQueue: boolean;
  currentUser: CurrentUser;
  ticket: AppTicket | null;
  settings: Pick<UserSettings, "reduceMotion" | "queueDisplayMode">;
  cashierStatus: WindowStatus;
  registrarStatus: WindowStatus;
}

export default function HomeView({
  heroParticles,
  heroWordIndex,
  hasActiveTicket,
  setStep,
  setTicketVisible,
  liveQueueCount,
  cashierQueue,
  registrarQueue,
  nowServingCashier,
  nowServingRegistrar,
  pulseQueue,
  currentUser,
  ticket,
  settings,
  cashierStatus,
  registrarStatus,
}: HomeViewProps) {
  return (
    <div className="fade-in">
      {/* Hero - with dynamic text and particles */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: 20,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "48px 40px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Animated Floating Snow / Starry Particles (disabled when Reduce Motion is active) */}
        {!settings.reduceMotion &&
          heroParticles.map((p, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, p.driftY, 0],
                x: [0, p.driftX, 0],
                opacity: [0.3, 0.95, 0.3],
                scale: [0.85, 1.25, 0.85],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: p.color,
                boxShadow: p.glow
                  ? `0 0 8px 2px ${p.color}, 0 0 16px rgba(147, 197, 253, 0.7)`
                  : `0 0 5px 1px ${p.color}`,
                pointerEvents: "none",
              }}
            />
          ))}

        <div style={{ position: "relative", zIndex: 1, maxWidth: 600 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 99,
              padding: "6px 14px",
              marginBottom: 24,
              fontSize: 11,
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            <BookOpen size={11} /> APPOINTMENT PERIOD · 2025–2026
          </div>

          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 42,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              marginBottom: 16,
            }}
          >
            {hasActiveTicket ? (
              "You're in the Queue."
            ) : (
              <>
                Skip the line.<br />
                Book your{" "}
                <span style={{ 
                  position: "relative", 
                  display: "inline-block",
                  verticalAlign: "baseline",
                }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={heroWordIndex}
                      initial={{ opacity: 0, scale: 0.7, filter: "blur(6px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.7, filter: "blur(6px)" }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      style={{
                        display: "inline",
                        backgroundImage: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {HERO_WORDS[heroWordIndex]}
                    </motion.span>
                  </AnimatePresence>
                  {/* Squiggle accent */}
                  <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" style={{ position: "absolute", bottom: -2, left: 0, opacity: 0.6 }}>
                    <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="#6366f1" strokeWidth="2" />
                  </svg>
                </span>
                {" "}online.
              </>
            )}

          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 400,
              fontWeight: 400,
            }}
          >
            {hasActiveTicket
              ? "You already have an active ticket. Click below to view your digital ticket and see your real-time position."
              : "Reserve your appointment in minutes. Get a digital ticket and arrive at your exact time — no waiting."}
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary"
            onClick={() => {
              if (hasActiveTicket) {
                setStep("ticket");
                setTicketVisible(true);
              } else {
                setStep("booking");
              }
            }}
            style={{
              marginTop: 32,
              background: hasActiveTicket ? "#fbbf24" : "white",
              color: hasActiveTicket ? "#78350f" : "#0f172a",
              border: "none",
              borderRadius: 12,
              padding: "14px 28px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Outfit', sans-serif",
              boxShadow: "0 4px 14px 0 rgba(255,255,255,0.1)",
            }}
          >
            {hasActiveTicket ? "View Active Ticket" : "Book an Appointment"} <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>

      {/* Stats Row — total in queue */}
      <div style={{ marginBottom: 24 }}>
        <div
          className="card-shadow"
          style={{
            background: "var(--surface)",
            borderRadius: 14,
            padding: "16px 18px",
            border: "1px solid var(--border-soft)",
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
        className="home-layout-grid"
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
            className="queue-split-grid"
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
              pulseQueue={pulseQueue}
              currentUserId={currentUser.accountId}
              currentUserTicketNumber={ticket?.number}
              currentUserDisplayMode={settings.queueDisplayMode}
            />
            <QueueColumn
              title="Registrar Window"
              icon={<Users size={15} color="#7c3aed" />}
              accentColor="#7c3aed"
              nowServingTicket={nowServingRegistrar}
              queue={registrarQueue}
              pulseQueue={pulseQueue}
              currentUserId={currentUser.accountId}
              currentUserTicketNumber={ticket?.number}
              currentUserDisplayMode={settings.queueDisplayMode}
            />
          </div>
        </div>

        {/* Notice + Quick Links */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* ── SEPARATED ANNOUNCEMENT BOARD CARDS ── */}
          {[
            { name: "Cashier", status: cashierStatus },
            { name: "Registrar", status: registrarStatus },
          ].map((win) => {
            const notice = getNoticeForWindow(win.name, win.status);
            return (
              <div
                key={win.name}
                className="card-shadow interactive-card"
                style={{
                  background: notice.bg,
                  border: `1px solid ${notice.border}`,
                  borderRadius: 16,
                  padding: "18px",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <WarningCircle
                    size={16}
                    color={notice.iconColor}
                    style={{ marginTop: 1, flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: notice.titleColor,
                        marginBottom: 4,
                      }}
                    >
                      {notice.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: notice.textColor,
                        lineHeight: 1.6,
                      }}
                    >
                      {notice.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!hasActiveTicket && (
            <div
              className="card-shadow"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-soft)",
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
                <MapPin size={14} color="var(--blue-600)" /> Appointment
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
          )}
        </div>
      </div>
    </div>
  );
}
