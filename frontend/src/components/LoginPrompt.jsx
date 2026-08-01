import { useNavigate } from "react-router-dom";
import { C, display, body, mono } from "../theme";
import { StampCircle } from "./StampCircle";

export function LoginPrompt() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-6 py-20 flex items-center min-h-[75vh]">
      <div
        className="w-full text-center rounded-lg p-10 md:p-12"
        style={{
          backgroundColor: C.paper,
          boxShadow: "0 22px 50px -20px rgba(58,20,10,0.35)",
          border: `1px solid ${C.line}`,
        }}
      >
        <div className="flex justify-center mb-8">
          <StampCircle rotate={-8} size="w-20 h-20" text="MAIL" sub="ROOM" />
        </div>

        <p
          className="uppercase tracking-[0.2em] text-xs mb-3"
          style={{ ...mono, color: C.rustDark }}
        >
          Return to sender
        </p>

        <h2
          className="text-3xl mb-4 tracking-tight"
          style={{ ...display, fontWeight: 700, color: C.ink }}
        >
          Log in to send a file
        </h2>

        <p
          className="text-base mb-10 max-w-sm mx-auto leading-relaxed"
          style={{ ...body, color: "rgba(58,42,32,0.75)" }}
        >
          You'll need an account so your parcels have a return address.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3.5 rounded hover:opacity-90 transition-opacity"
            style={{
              ...mono,
              backgroundColor: C.ink,
              color: C.paper,
              fontSize: "14px",
            }}
          >
            Log in
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-8 py-3.5 rounded hover:bg-black/5 transition-colors"
            style={{
              ...mono,
              border: `1px solid ${C.line}`,
              color: C.ink,
              fontSize: "14px",
            }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
