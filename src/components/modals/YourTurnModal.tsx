import { motion, AnimatePresence } from "framer-motion";
import { BellRinging, MapPin, Check } from "@phosphor-icons/react";
import { SCHOOL_NAME, VENUE, type AppTicket } from "../../types/booking";

export interface YourTurnModalProps {
  isYourTurn: boolean;
  ticket: AppTicket | null;
  onDismiss: () => void;
}

export default function YourTurnModal({
  isYourTurn,
  ticket,
  onDismiss,
}: YourTurnModalProps) {
  return (
    <AnimatePresence>
      {isYourTurn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(5, 46, 22, 0.96)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
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
              <BellRinging size={44} color="#4ade80" className="bell-shake" />
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
              {SCHOOL_NAME.toUpperCase()} · APPOINTMENT QUEUE
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
              onClick={onDismiss}
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
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
              <Check size={18} weight="bold" /> Got it — I'm on my way
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
