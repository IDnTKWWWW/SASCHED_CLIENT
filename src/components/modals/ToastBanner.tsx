import { motion, AnimatePresence } from "framer-motion";
import { Ticket } from "@phosphor-icons/react";

export interface ToastBannerProps {
  toastMessage: string | null;
  onDismiss: () => void;
}

export default function ToastBanner({
  toastMessage,
  onDismiss,
}: ToastBannerProps) {
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
            color: "white",
            borderRadius: 14,
            padding: "14px 22px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            boxShadow: "0 8px 32px rgba(37,99,235,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: "90vw",
            whiteSpace: "nowrap",
          }}
        >
          <Ticket size={18} color="white" weight="fill" />
          <span>{toastMessage}</span>
          <button
            onClick={onDismiss}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 99,
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              cursor: "pointer",
              marginLeft: 4,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
