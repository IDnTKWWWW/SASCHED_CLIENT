import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface StudentLoginProps {
  onLoginSuccess: () => void;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STI_EMAIL_DOMAIN = "@calamba.sti.edu.ph";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function StudentLogin({ onLoginSuccess }: StudentLoginProps) {
  // ── Shared state ──────────────────────────────────────────
  const [isSignUp, setIsSignUp] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  // ── Login state ───────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // ── Anti brute-force lockout ──────────────────────────────
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const lockoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Sign-up state ─────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // ── Mount animation ───────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // ── Clear error when switching modes ──────────────────────
  useEffect(() => {
    setError(null);
    setSignUpSuccess(false);
    setFocused(null);
  }, [isSignUp]);

  // ── Lockout countdown tick ────────────────────────────────
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    lockoutRef.current = setInterval(() => {
      setLockoutTimer((t) => {
        if (t <= 1) {
          clearInterval(lockoutRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(lockoutRef.current!);
  }, [lockoutTimer]);

  const isLockedOut = lockoutTimer > 0;

  // ── Login handler (with brute-force lockout) ──────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword || isLockedOut) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    setLoading(false);

    if (authError) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setFailedAttempts(0);
        setError(
          `Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds before trying again.`
        );
      } else {
        const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
        setError(
          authError.message === "Invalid login credentials"
            ? `Incorrect email or password. ${remaining} attempt${
                remaining === 1 ? "" : "s"
              } remaining before lockout.`
            : authError.message
        );
      }
      return;
    }

    // Successful — reset attempts
    setFailedAttempts(0);
    onLoginSuccess();
  };

  // ── Sign-up handler ───────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Name validation
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    // 2. Domain validation
    if (!signUpEmail.trim().toLowerCase().endsWith(STI_EMAIL_DOMAIN)) {
      setError("You must use your official STI Calamba email.");
      return;
    }

    // 3. Password length
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: signUpEmail.trim().toLowerCase(),
      password: signUpPassword,
      options: {
        data: {
          display_name: fullName.trim(),
        },
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // Success — show message then flip back to login
    setSignUpSuccess(true);
    setTimeout(() => {
      setIsSignUp(false);
      setSignUpSuccess(false);
      setFullName("");
      setSignUpEmail("");
      setSignUpPassword("");
    }, 2600);
  };

  // ── Derived ────────────────────────────────────────────────
  const canLogin =
    loginEmail.trim().length > 0 &&
    loginPassword.length > 0 &&
    !loading &&
    !isLockedOut;

  const canSignUp =
    fullName.trim().length > 0 &&
    signUpEmail.trim().length > 0 &&
    signUpPassword.length >= 6 &&
    !loading;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/currentbg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Outfit', 'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Keyframes & font ──────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --blue-50:  #eff6ff;
          --blue-100: #dbeafe;
          --blue-200: #bfdbfe;
          --blue-400: #60a5fa;
          --blue-500: #3b82f6;
          --blue-600: #2563eb;
          --blue-700: #1d4ed8;
          --blue-900: #1e3a8a;
          --slate-300: #cbd5e1;
          --slate-400: #94a3b8;
          --slate-500: #64748b;
          --slate-600: #475569;
          --slate-700: #334155;
          --slate-800: #1e293b;
          --red-400:   #f87171;
          --red-500:   #ef4444;
          --green-500: #22c55e;
          --green-600: #16a34a;
        }

        @keyframes cardRise {
          from { opacity: 0; transform: translateY(28px) scale(0.975); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        @keyframes formSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes staggerUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes successPop {
          0%   { opacity: 0; transform: scale(0.88) translateY(8px); }
          60%  { transform: scale(1.04) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes lockoutPulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.6; }
        }

        .sl-btn:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 32px rgba(37,99,235,0.32) !important;
        }
        .sl-btn:active:not(:disabled) { transform: translateY(0px) !important; }
        .sl-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .sl-btn-green:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 32px rgba(22,163,74,0.3) !important;
        }
        .sl-btn-green:active:not(:disabled) { transform: translateY(0px) !important; }
        .sl-btn-green:disabled { opacity: 0.55; cursor: not-allowed; }

        .sl-forgot:hover { color: var(--blue-600) !important; text-decoration: underline; }
        .sl-create:hover { color: var(--blue-700) !important; text-decoration: underline; }
        .sl-eye:hover { color: var(--blue-600) !important; }
        .sl-back:hover { background: rgba(37,99,235,0.06) !important; }
      `}</style>

      {/* ── Frosted-glass card ────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 440,
          margin: "0 16px",
          background: "rgba(255, 255, 255, 0.30)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow:
            "0 8px 32px rgba(59,130,246,0.08), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
          padding: "48px 44px 44px",
          animation: mounted
            ? "cardRise 0.55s cubic-bezier(.22,.68,0,1.2) both"
            : "none",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: 3,
            borderRadius: "0 0 99px 99px",
            background: isSignUp
              ? "linear-gradient(90deg, #4ade80, #22c55e, #16a34a)"
              : "linear-gradient(90deg, #60a5fa, #2563eb, #1d4ed8)",
            boxShadow: isSignUp
              ? "0 2px 12px rgba(34,197,94,0.35)"
              : "0 2px 12px rgba(37,99,235,0.35)",
            transition: "background 0.4s ease, box-shadow 0.4s ease",
          }}
        />

        {/* ── Branding ──────────────────────────────────────────── */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 32,
            animation: mounted ? "staggerUp 0.45s 0.12s both ease" : "none",
          }}
        >
          <img
            src="/logo.png"
            alt="STI Logo"
            style={{
              display: "block",
              margin: "0 auto 16px auto",
              width: 72,
              height: 72,
              objectFit: "contain",
              borderRadius: 12,
            }}
          />
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: "-0.03em",
              color: "#1e293b",
              lineHeight: 1.1,
              marginBottom: 6,
            }}
          >
            STI Calamba
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: "0.14em",
              color: isSignUp ? "var(--green-600)" : "var(--blue-600)",
              textTransform: "uppercase",
              marginBottom: 4,
              transition: "color 0.3s ease",
            }}
          >
            SAS · {isSignUp ? "Create Account" : "Appointment System"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--slate-400)",
              fontWeight: 400,
              marginTop: 2,
            }}
          >
            Student Portal
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SUCCESS BANNER (sign-up complete)                        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {signUpSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 18px",
              borderRadius: 14,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              marginBottom: 22,
              animation: "successPop 0.5s cubic-bezier(.22,.68,0,1.2) both",
            }}
          >
            <CheckCircle2
              size={22}
              color="var(--green-600)"
              style={{ flexShrink: 0 }}
            />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--green-600)",
                  marginBottom: 2,
                }}
              >
                Account created!
              </div>
              <div style={{ fontSize: 12, color: "#15803d", lineHeight: 1.5 }}>
                You can now sign in with your credentials.
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ERROR BOX                                                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        {error && !signUpSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 22,
              padding: "13px 16px",
              borderRadius: 12,
              background: isLockedOut
                ? "rgba(245,158,11,0.08)"
                : "rgba(239,68,68,0.07)",
              border: isLockedOut
                ? "1px solid rgba(245,158,11,0.25)"
                : "1px solid rgba(239,68,68,0.22)",
              animation:
                "shake 0.4s cubic-bezier(.36,.07,.19,.97) both, staggerUp 0.3s ease both",
            }}
          >
            <AlertCircle
              size={16}
              color={isLockedOut ? "#f59e0b" : "var(--red-500)"}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div
              style={{
                fontSize: 13,
                color: isLockedOut ? "#b45309" : "var(--red-500)",
                fontWeight: 500,
                lineHeight: 1.5,
                flex: 1,
              }}
            >
              {error}
              {isLockedOut && (
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#f59e0b",
                    animation: "lockoutPulse 1s ease-in-out infinite",
                  }}
                >
                  {lockoutTimer}s
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SIGN-IN FORM                                              */}
        {/* ══════════════════════════════════════════════════════════ */}
        {!isSignUp && (
          <form
            onSubmit={handleLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              animation: "formSlideIn 0.35s ease both",
            }}
          >
            {/* Email */}
            <div
              style={{
                marginBottom: 14,
                animation: mounted ? "staggerUp 0.45s 0.2s both ease" : "none",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  color: "var(--slate-500)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <div
                onClick={() =>
                  document.getElementById("sas-login-email")?.focus()
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "0 16px",
                  height: 52,
                  borderRadius: 12,
                  background:
                    focused === "login-email"
                      ? "#fff"
                      : "rgba(248,250,252,0.9)",
                  border:
                    focused === "login-email"
                      ? "1.5px solid var(--blue-500)"
                      : "1.5px solid rgba(203,213,225,0.85)",
                  boxShadow:
                    focused === "login-email"
                      ? "0 0 0 4px rgba(37,99,235,0.10)"
                      : "0 1px 2px rgba(0,0,0,0.03)",
                  cursor: "text",
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                }}
              >
                <User
                  size={17}
                  color={
                    focused === "login-email"
                      ? "var(--blue-600)"
                      : "var(--slate-400)"
                  }
                  strokeWidth={2}
                  style={{ flexShrink: 0, transition: "color 0.2s ease" }}
                />
                <input
                  id="sas-login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onFocus={() => setFocused("login-email")}
                  onBlur={() => setFocused(null)}
                  placeholder="lebron.395692@calamba.sti.edu.ph"
                  autoComplete="username"
                  required
                  disabled={isLockedOut}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "var(--slate-800)",
                    letterSpacing: "-0.01em",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div
              style={{
                marginBottom: 10,
                animation: mounted ? "staggerUp 0.45s 0.28s both ease" : "none",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  color: "var(--slate-500)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <div
                onClick={() => document.getElementById("sas-login-pw")?.focus()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "0 16px",
                  height: 52,
                  borderRadius: 12,
                  background:
                    focused === "login-pw" ? "#fff" : "rgba(248,250,252,0.9)",
                  border:
                    focused === "login-pw"
                      ? "1.5px solid var(--blue-500)"
                      : "1.5px solid rgba(203,213,225,0.85)",
                  boxShadow:
                    focused === "login-pw"
                      ? "0 0 0 4px rgba(37,99,235,0.10)"
                      : "0 1px 2px rgba(0,0,0,0.03)",
                  cursor: "text",
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                }}
              >
                <Lock
                  size={17}
                  color={
                    focused === "login-pw"
                      ? "var(--blue-600)"
                      : "var(--slate-400)"
                  }
                  strokeWidth={2}
                  style={{ flexShrink: 0, transition: "color 0.2s ease" }}
                />
                <input
                  id="sas-login-pw"
                  type={showLoginPw ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onFocus={() => setFocused("login-pw")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={isLockedOut}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 400,
                    color: "var(--slate-800)",
                  }}
                />
                <button
                  type="button"
                  className="sl-eye"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLoginPw((p) => !p);
                  }}
                  tabIndex={-1}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--slate-400)",
                    flexShrink: 0,
                    transition: "color 0.15s ease",
                  }}
                  aria-label={showLoginPw ? "Hide password" : "Show password"}
                >
                  {showLoginPw ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 28,
                animation: mounted ? "staggerUp 0.45s 0.33s both ease" : "none",
              }}
            >
              <button
                type="button"
                className="sl-forgot"
                onClick={() => alert("Coming soon!")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--slate-500)",
                  padding: 0,
                  fontFamily: "'Outfit', sans-serif",
                  transition: "color 0.15s ease",
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              className="sl-btn"
              disabled={!canLogin}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 13,
                border: "none",
                background: isLockedOut
                  ? "linear-gradient(135deg, #94a3b8, #64748b)"
                  : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "white",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "0.03em",
                cursor: isLockedOut ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                boxShadow: isLockedOut
                  ? "none"
                  : "0 6px 20px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, background 0.3s ease",
                animation: mounted ? "staggerUp 0.45s 0.38s both ease" : "none",
                marginBottom: 22,
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: "2.5px solid rgba(255,255,255,0.35)",
                      borderTop: "2.5px solid white",
                      borderRadius: "50%",
                      animation: "spin 0.75s linear infinite",
                    }}
                  />
                  Signing in…
                </>
              ) : isLockedOut ? (
                <>Locked — {lockoutTimer}s</>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} strokeWidth={2.5} />
                </>
              )}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 22,
                animation: mounted ? "staggerUp 0.45s 0.44s both ease" : "none",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(203,213,225,0.6)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--slate-400)",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                OR
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(203,213,225,0.6)",
                }}
              />
            </div>

            {/* Create account link */}
            <div
              style={{
                textAlign: "center",
                animation: mounted ? "staggerUp 0.45s 0.50s both ease" : "none",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--slate-500)",
                  fontWeight: 400,
                }}
              >
                Don't have an account?{" "}
              </span>
              <button
                type="button"
                className="sl-create"
                onClick={() => setIsSignUp(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--blue-600)",
                  padding: 0,
                  fontFamily: "'Outfit', sans-serif",
                  transition: "color 0.15s ease",
                  textDecoration: "none",
                }}
              >
                Create one
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SIGN-UP FORM                                              */}
        {/* ══════════════════════════════════════════════════════════ */}
        {isSignUp && !signUpSuccess && (
          <form
            onSubmit={handleSignUp}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              animation: "formSlideIn 0.38s cubic-bezier(.22,.68,0,1.2) both",
            }}
          >
            {/* Full Name */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  color: "var(--slate-500)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Full Name
              </label>
              <div
                onClick={() =>
                  document.getElementById("sas-signup-name")?.focus()
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "0 16px",
                  height: 52,
                  borderRadius: 12,
                  background:
                    focused === "signup-name"
                      ? "#fff"
                      : "rgba(248,250,252,0.9)",
                  border:
                    focused === "signup-name"
                      ? "1.5px solid var(--green-500)"
                      : "1.5px solid rgba(203,213,225,0.85)",
                  boxShadow:
                    focused === "signup-name"
                      ? "0 0 0 4px rgba(34,197,94,0.10)"
                      : "0 1px 2px rgba(0,0,0,0.03)",
                  cursor: "text",
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                }}
              >
                <UserPlus
                  size={17}
                  color={
                    focused === "signup-name"
                      ? "var(--green-600)"
                      : "var(--slate-400)"
                  }
                  strokeWidth={2}
                  style={{ flexShrink: 0, transition: "color 0.2s ease" }}
                />
                <input
                  id="sas-signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFocused("signup-name")}
                  onBlur={() => setFocused(null)}
                  placeholder="e.g. Mark Andrie A. Cantara"
                  autoComplete="name"
                  required
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 400,
                    color: "var(--slate-800)",
                  }}
                />
              </div>
            </div>

            {/* STI Email */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  color: "var(--slate-500)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                STI Email
              </label>
              <div
                onClick={() =>
                  document.getElementById("sas-signup-email")?.focus()
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "0 16px",
                  height: 52,
                  borderRadius: 12,
                  background:
                    focused === "signup-email"
                      ? "#fff"
                      : "rgba(248,250,252,0.9)",
                  border:
                    focused === "signup-email"
                      ? "1.5px solid var(--green-500)"
                      : "1.5px solid rgba(203,213,225,0.85)",
                  boxShadow:
                    focused === "signup-email"
                      ? "0 0 0 4px rgba(34,197,94,0.10)"
                      : "0 1px 2px rgba(0,0,0,0.03)",
                  cursor: "text",
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                }}
              >
                <User
                  size={17}
                  color={
                    focused === "signup-email"
                      ? "var(--green-600)"
                      : "var(--slate-400)"
                  }
                  strokeWidth={2}
                  style={{ flexShrink: 0, transition: "color 0.2s ease" }}
                />
                <input
                  id="sas-signup-email"
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  onFocus={() => setFocused("signup-email")}
                  onBlur={() => setFocused(null)}
                  placeholder="lastname.123456@calamba.sti.edu.ph"
                  autoComplete="email"
                  required
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    fontWeight: 400,
                    color: "var(--slate-800)",
                    letterSpacing: "-0.01em",
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--slate-400)",
                  paddingLeft: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--green-500)",
                    flexShrink: 0,
                  }}
                />
                Must end with <strong>@calamba.sti.edu.ph</strong>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  color: "var(--slate-500)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <div
                onClick={() =>
                  document.getElementById("sas-signup-pw")?.focus()
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "0 16px",
                  height: 52,
                  borderRadius: 12,
                  background:
                    focused === "signup-pw" ? "#fff" : "rgba(248,250,252,0.9)",
                  border:
                    focused === "signup-pw"
                      ? "1.5px solid var(--green-500)"
                      : "1.5px solid rgba(203,213,225,0.85)",
                  boxShadow:
                    focused === "signup-pw"
                      ? "0 0 0 4px rgba(34,197,94,0.10)"
                      : "0 1px 2px rgba(0,0,0,0.03)",
                  cursor: "text",
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                }}
              >
                <Lock
                  size={17}
                  color={
                    focused === "signup-pw"
                      ? "var(--green-600)"
                      : "var(--slate-400)"
                  }
                  strokeWidth={2}
                  style={{ flexShrink: 0, transition: "color 0.2s ease" }}
                />
                <input
                  id="sas-signup-pw"
                  type={showSignUpPw ? "text" : "password"}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  onFocus={() => setFocused("signup-pw")}
                  onBlur={() => setFocused(null)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 400,
                    color: "var(--slate-800)",
                  }}
                />
                <button
                  type="button"
                  className="sl-eye"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSignUpPw((p) => !p);
                  }}
                  tabIndex={-1}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--slate-400)",
                    flexShrink: 0,
                    transition: "color 0.15s ease",
                  }}
                  aria-label={showSignUpPw ? "Hide password" : "Show password"}
                >
                  {showSignUpPw ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
              {/* Password strength hint */}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                {[1, 2, 3, 4].map((lvl) => {
                  const len = signUpPassword.length;
                  const filled =
                    (lvl === 1 && len >= 1) ||
                    (lvl === 2 && len >= 4) ||
                    (lvl === 3 && len >= 6) ||
                    (lvl === 4 && len >= 10);
                  const color =
                    len >= 10
                      ? "#22c55e"
                      : len >= 6
                      ? "#84cc16"
                      : len >= 4
                      ? "#f59e0b"
                      : "#ef4444";
                  return (
                    <div
                      key={lvl}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 99,
                        background: filled ? color : "rgba(203,213,225,0.5)",
                        transition: "background 0.25s ease",
                      }}
                    />
                  );
                })}
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--slate-400)",
                    marginLeft: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {signUpPassword.length === 0
                    ? "Enter password"
                    : signUpPassword.length < 4
                    ? "Too short"
                    : signUpPassword.length < 6
                    ? "Weak"
                    : signUpPassword.length < 10
                    ? "Good"
                    : "Strong"}
                </span>
              </div>
            </div>

            {/* Create Account button */}
            <button
              type="submit"
              className="sl-btn-green"
              disabled={!canSignUp}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 13,
                border: "none",
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                color: "white",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "0.03em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                boxShadow:
                  "0 6px 20px rgba(34,197,94,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
                marginBottom: 16,
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: "2.5px solid rgba(255,255,255,0.35)",
                      borderTop: "2.5px solid white",
                      borderRadius: "50%",
                      animation: "spin 0.75s linear infinite",
                    }}
                  />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={17} strokeWidth={2.5} />
                  Create Account
                </>
              )}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              className="sl-back"
              onClick={() => setIsSignUp(false)}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 11,
                border: "1.5px solid rgba(203,213,225,0.7)",
                background: "rgba(248,250,252,0.7)",
                color: "var(--slate-600)",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                transition: "background 0.18s ease",
              }}
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
              Back to Login
            </button>
          </form>
        )}

        {/* ── Bottom footnote ───────────────────────────────────── */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: "1px solid rgba(203,213,225,0.45)",
            textAlign: "center",
            animation: mounted ? "staggerUp 0.45s 0.56s both ease" : "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "var(--slate-400)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            STI Calamba SAS · Student Access Portal
          </div>
        </div>
      </div>
    </div>
  );
}
