import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound, User } from "lucide-react";
import { C, display, body, mono } from "../theme";
import { StampCircle } from "../components/StampCircle";
import { LineField } from "../components/LineField";

export function AuthPage({ mode, onSuccess }) {
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.detail?.[0]?.msg || data?.detail || "Authentication failed",
        );
      }

      const data = await res.json(); // AuthResponse { user, access_token }
      // The old fake auth used { email, name }, let's map it or just pass data
      onSuccess(data);
      navigate("/upload");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex items-center min-h-[85vh]">
      <div
        className="w-full rounded-lg p-10 md:p-14 flex flex-col md:flex-row gap-12 md:gap-20"
        style={{
          backgroundColor: C.paper,
          boxShadow: "0 22px 50px -20px rgba(58,20,10,0.35)",
          border: `1px solid ${C.line}`,
        }}
      >
        {/* Left Column: Branding */}
        <div className="md:w-[45%] flex flex-col justify-between">
          <div>
            <div className="hidden md:block mb-10">
              <StampCircle
                rotate={-10}
                size="w-20 h-20"
                text="AUTH"
                sub="REQ"
              />
            </div>
            <p
              className="text-xs uppercase tracking-[0.2em] mb-4"
              style={{ ...mono, color: C.rustDark }}
            >
              {isLogin ? "Welcome back to the" : "Become a member of the"}
            </p>
            <h2
              className="text-4xl md:text-5xl tracking-tight leading-[1.05]"
              style={{ ...display, fontWeight: 700, color: C.ink }}
            >
              POST
              <br />
              OFFICE
            </h2>
            <div
              className="md:hidden mt-6 flex justify-between items-center"
              style={{
                borderBottom: `2px dashed ${C.line}`,
                paddingBottom: "24px",
              }}
            >
              <StampCircle rotate={12} size="w-16 h-16" text="AUTH" sub="REQ" />
            </div>
          </div>

          <div
            className="hidden md:block mt-12 pt-8"
            style={{ borderTop: `2px dashed ${C.line}` }}
          >
            <p
              className="text-sm"
              style={{ ...body, color: "rgba(58,42,32,0.75)" }}
            >
              {isLogin ? "New here? " : "Already have an account? "}
              <Link
                to={isLogin ? "/signup" : "/login"}
                className="underline hover:text-black transition-colors"
                style={{ color: C.rustDark }}
              >
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </p>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="md:w-[55%] flex flex-col justify-center">
          <form
            onSubmit={submit}
            className="flex flex-col h-full justify-center"
          >
            <div className="flex flex-col gap-y-10 mb-8">
              {!isLogin && (
                <LineField
                  icon={User}
                  label="Name (Optional)"
                  type="text"
                  value={form.name}
                  onChange={update("name")}
                />
              )}
              <LineField
                icon={Mail}
                label="Email Address"
                required
                type="email"
                value={form.email}
                onChange={update("email")}
              />
              <div>
                <LineField
                  icon={KeyRound}
                  label="Password"
                  required
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                />
                {isLogin && (
                  <div className="mt-8">
                    <Link
                      to="#"
                      className="text-xs uppercase tracking-widest underline underline-offset-[6px] hover:text-black transition-colors"
                      style={{ ...mono, color: C.rustDark }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div
                className="mb-6 p-3 rounded text-sm"
                style={{
                  backgroundColor: "rgba(193,64,42,0.1)",
                  color: C.rustDark,
                  ...mono,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded hover:opacity-90 transition-opacity flex items-center justify-center mt-auto"
              style={{
                ...mono,
                backgroundColor: C.ink,
                color: C.paper,
                fontSize: "14px",
              }}
            >
              {isLogin ? "Unlock & Enter" : "Register Address"}
            </button>
          </form>

          {/* Mobile only footer link */}
          <div
            className="md:hidden mt-10 pt-6 text-center"
            style={{ borderTop: `2px dashed ${C.line}` }}
          >
            <p
              className="text-sm"
              style={{ ...body, color: "rgba(58,42,32,0.75)" }}
            >
              {isLogin ? "New here? " : "Already have an account? "}
              <Link
                to={isLogin ? "/signup" : "/login"}
                className="underline hover:text-black transition-colors"
                style={{ color: C.rustDark }}
              >
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
