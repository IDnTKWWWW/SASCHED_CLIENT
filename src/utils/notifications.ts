// ── Audio Chime Synthesizer ─────────────────────────────────
// Shared module AudioContext singleton across window session
let sharedAudioCtx: AudioContext | null = null;

export const playTurnChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;
    // 3-tone ascending chime (C5 -> E5 -> G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.5);
    });
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[DEV] playTurnChime error:", e);
  }
};

// ── Web Push / Browser Notification ─────────────────────────
export const notifyTurn = (ticketNum?: string, windowName?: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("It's Your Turn! — SASCHED", {
        body: `Ticket ${ticketNum || "your ticket"} is being called at ${windowName || "the window"}. Please proceed immediately!`,
        icon: "/logo.png",
      });
    } catch (e) {
      if (import.meta.env.DEV) console.warn("[DEV] notifyTurn error:", e);
    }
  }
};
