"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Film,
  Loader2,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types & Helpers
───────────────────────────────────────────── */

type Mode = "signin" | "signup";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface FieldMeta {
  touched: boolean;
  dirty: boolean;
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
}

function validatePassword(password: string, mode: Mode): string | undefined {
  if (!password) return "Password is required";
  if (mode === "signup") {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter";
    if (!/[0-9]/.test(password)) return "Include at least one number";
  }
}

function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | undefined {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#f7b731" };
  if (score <= 3) return { score: 3, label: "Good", color: "#fda085" };
  if (score <= 4) return { score: 4, label: "Strong", color: "#34d399" };
  return { score: 5, label: "Very strong", color: "#10b981" };
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function InputField({
  id,
  label,
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  icon: Icon,
  error,
  touched,
  rightElement,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
  icon: React.ElementType;
  error?: string;
  touched: boolean;
  rightElement?: React.ReactNode;
  autoComplete?: string;
}) {
  const hasError = touched && error;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "0.82rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: hasError ? "#ef4444" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            transition: "color 200ms",
          }}
        >
          <Icon style={{ width: 16, height: 16 }} />
        </span>

        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="input-glow"
          style={{
            paddingLeft: 42,
            paddingRight: rightElement ? 44 : 16,
            borderColor: hasError ? "rgba(239,68,68,0.5)" : undefined,
            boxShadow: hasError ? "0 0 0 3px rgba(239,68,68,0.12)" : undefined,
          }}
        />

        {rightElement && (
          <span
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {rightElement}
          </span>
        )}
      </div>

      <div
        style={{
          overflow: "hidden",
          maxHeight: hasError ? 40 : 0,
          opacity: hasError ? 1 : 0,
          transition: "max-height 200ms ease, opacity 200ms ease",
        }}
      >
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: "0.75rem",
            color: "#ef4444",
            margin: 0,
            paddingTop: 2,
            fontFamily: "var(--font-body)",
          }}
        >
          <AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} />
          {error}
        </p>
      </div>
    </div>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= score ? color : "var(--border-color)",
              transition: "background 300ms ease",
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontSize: "0.72rem",
          color,
          margin: 0,
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          transition: "color 300ms ease",
        }}
      >
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main AuthForm Component
───────────────────────────────────────────── */

export function AuthForm({ defaultMode = "signin" }: { defaultMode?: Mode }) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [animating, setAnimating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
  });

  const [meta, setMeta] = useState<Record<keyof Omit<FormState, "rememberMe">, FieldMeta>>({
    email: { touched: false, dirty: false },
    password: { touched: false, dirty: false },
    confirmPassword: { touched: false, dirty: false },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const switchMode = useCallback(
    (next: Mode) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setMode(next);
        setForm({ email: "", password: "", confirmPassword: "", rememberMe: false });
        setMeta({
          email: { touched: false, dirty: false },
          password: { touched: false, dirty: false },
          confirmPassword: { touched: false, dirty: false },
        });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setSuccessMessage(null);
        setAnimating(false);
      }, 300);
    },
    [animating]
  );

  useEffect(() => {
    const newErrors: FormErrors = {};
    if (meta.email.dirty) newErrors.email = validateEmail(form.email);
    if (meta.password.dirty) newErrors.password = validatePassword(form.password, mode);
    if (mode === "signup" && meta.confirmPassword.dirty)
      newErrors.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword);
    setErrors((prev) => ({ ...newErrors, general: prev.general }));
  }, [form, mode, meta]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key !== "rememberMe") {
      setMeta((prev) => ({
        ...prev,
        [key]: { ...prev[key as keyof typeof meta], dirty: true },
      }));
    }
    setErrors((prev) => ({ ...prev, general: undefined }));
  };

  const touchField = (key: keyof typeof meta) => {
    setMeta((prev) => ({ ...prev, [key]: { ...prev[key], touched: true } }));
  };

  const isFormValid = () => {
    if (validateEmail(form.email)) return false;
    if (validatePassword(form.password, mode)) return false;
    if (mode === "signup" && validateConfirmPassword(form.password, form.confirmPassword))
      return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMeta({
      email: { touched: true, dirty: true },
      password: { touched: true, dirty: true },
      confirmPassword: { touched: true, dirty: true },
    });

    if (!isFormValid()) return;

    setLoading(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setSuccessMessage(
          "Account created! Check your inbox to confirm your email before signing in."
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/drive.file",
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email || validateEmail(form.email)) {
      setMeta((prev) => ({ ...prev, email: { touched: true, dirty: true } }));
      setErrors({ general: "Enter a valid email address above to reset your password." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setErrors({ general: error.message });
    } else {
      setSuccessMessage("Password reset email sent! Check your inbox.");
    }
  };

  const EyeButton = ({
    show,
    toggle,
    id,
  }: {
    show: boolean;
    toggle: () => void;
    id: string;
  }) => (
    <button
      id={id}
      type="button"
      onClick={toggle}
      aria-label={show ? "Hide password" : "Show password"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        padding: 2,
        transition: "color 150ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
    >
      {show ? (
        <EyeOff style={{ width: 16, height: 16 }} />
      ) : (
        <Eye style={{ width: 16, height: 16 }} />
      )}
    </button>
  );

  return (
    <div className="auth-page-root">
      {/* Decorative orbs */}
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />
      <div className="auth-orb auth-orb-3" aria-hidden="true" />

      {/* Card */}
      <div
        className="auth-card animate-fade-in"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating
            ? "translateY(16px) scale(0.98)"
            : "translateY(0) scale(1)",
          transition: "opacity 300ms ease, transform 300ms ease",
        }}
      >
        {/* Logo */}
        <div className="auth-logo-row">
          <div className="auth-logo-icon">
            <Film style={{ width: 22, height: 22, color: "white" }} />
          </div>
          <span className="logo-text">muvi</span>
        </div>

        {/* Mode Toggle */}
        <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
          <button
            id="auth-tab-signin"
            role="tab"
            aria-selected={mode === "signin"}
            type="button"
            onClick={() => switchMode("signin")}
            className={`auth-tab${mode === "signin" ? " auth-tab-active" : ""}`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-signup"
            role="tab"
            aria-selected={mode === "signup"}
            type="button"
            onClick={() => switchMode("signup")}
            className={`auth-tab${mode === "signup" ? " auth-tab-active" : ""}`}
          >
            Sign Up
          </button>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.6rem",
              fontWeight: 800,
              margin: "0 0 6px",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            {mode === "signin"
              ? "Sign in to access your movie library"
              : "Join muvi and start building your library"}
          </p>
        </div>

        {/* Success banner */}
        {successMessage && (
          <div className="auth-success-banner" role="alert">
            <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error banner */}
        {errors.general && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Google OAuth */}
        <button
          id="auth-google-btn"
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="auth-google-btn"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="auth-divider" aria-hidden="true">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">or continue with email</span>
          <span className="auth-divider-line" />
        </div>

        {/* Email / Password Form */}
        <form id="auth-email-form" onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputField
              id="auth-email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={(v) => setField("email", v)}
              onBlur={() => touchField("email")}
              placeholder="you@example.com"
              icon={Mail}
              error={errors.email}
              touched={meta.email.touched}
              autoComplete="email"
            />

            <div>
              <InputField
                id="auth-password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(v) => setField("password", v)}
                onBlur={() => touchField("password")}
                placeholder={
                  mode === "signup"
                    ? "Min. 8 chars, 1 uppercase, 1 number"
                    : "Enter your password"
                }
                icon={Lock}
                error={errors.password}
                touched={meta.password.touched}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                rightElement={
                  <EyeButton
                    id="auth-toggle-password"
                    show={showPassword}
                    toggle={() => setShowPassword((p) => !p)}
                  />
                }
              />
              {mode === "signup" && <PasswordStrengthBar password={form.password} />}
            </div>

            {/* Confirm Password - only in signup */}
            {mode === "signup" && (
              <InputField
                id="auth-confirm-password"
                label="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(v) => setField("confirmPassword", v)}
                onBlur={() => touchField("confirmPassword")}
                placeholder="Repeat your password"
                icon={Lock}
                error={errors.confirmPassword}
                touched={meta.confirmPassword.touched}
                autoComplete="new-password"
                rightElement={
                  <EyeButton
                    id="auth-toggle-confirm-password"
                    show={showConfirmPassword}
                    toggle={() => setShowConfirmPassword((p) => !p)}
                  />
                }
              />
            )}

            {/* Remember me + Forgot password */}
            {mode === "signin" && (
              <div className="auth-remember-row">
                <label htmlFor="auth-remember-me" className="auth-checkbox-label">
                  <div className="auth-checkbox-wrapper">
                    <input
                      id="auth-remember-me"
                      type="checkbox"
                      checked={form.rememberMe}
                      onChange={(e) => setField("rememberMe", e.target.checked)}
                      className="auth-checkbox-input"
                    />
                    <div
                      className={`auth-checkbox-custom${
                        form.rememberMe ? " auth-checkbox-checked" : ""
                      }`}
                    >
                      {form.rememberMe && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          aria-hidden="true"
                        >
                          <path
                            d="M1 4l2.5 2.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span>Remember me</span>
                </label>

                <button
                  id="auth-forgot-password"
                  type="button"
                  onClick={handleForgotPassword}
                  className="auth-link-btn"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Terms for signup */}
            {mode === "signup" && (
              <p className="auth-terms">
                By creating an account you agree to our{" "}
                <span className="auth-link-inline">Terms of Service</span> and{" "}
                <span className="auth-link-inline">Privacy Policy</span>.
              </p>
            )}

            {/* Submit */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2
                    style={{
                      width: 18,
                      height: 18,
                      animation: "spin-slow 0.8s linear infinite",
                    }}
                  />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </>
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight style={{ width: 18, height: 18, marginLeft: 4 }} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Mode switch footer */}
        <p className="auth-mode-switch">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                id="auth-switch-to-signup"
                type="button"
                onClick={() => switchMode("signup")}
                className="auth-link-btn"
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                id="auth-switch-to-signin"
                type="button"
                onClick={() => switchMode("signin")}
                className="auth-link-btn"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
