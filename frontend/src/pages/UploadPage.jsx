import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Copy, Check, ArrowLeft, Settings2 } from "lucide-react";
import { C, display, body, mono } from "../theme";
import { StampCard } from "../components/StampCard";
import { StampCircle } from "../components/StampCircle";

function SettingToggle({ label, checked, onChange }) {
  return (
    <label
      className="flex items-center justify-between cursor-pointer py-3"
      style={{ borderBottom: `1px solid ${C.line}` }}
    >
      <span
        className="text-sm uppercase tracking-widest"
        style={{ ...mono, color: C.ink }}
      >
        {label}
      </span>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className="w-10 h-5 rounded-full transition-colors"
          style={{ backgroundColor: checked ? C.rust : "rgba(58,42,32,0.2)" }}
        >
          <div
            className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${checked ? "left-6" : "left-1"}`}
          />
        </div>
      </div>
    </label>
  );
}

export function UploadPage({ isLoggedIn }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [link, setLink] = useState(null);
  const [stampDate, setStampDate] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Settings state
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("");

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setLink(null);
  }

  function randomToken() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 4; i++)
      out += chars[Math.floor(Math.random() * chars.length)];
    out += "-";
    for (let i = 0; i < 4; i++)
      out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function generateLink() {
    setLink("postoffice.sh/p/" + randomToken());
    const d = new Date();
    setStampDate(
      d
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
        .toUpperCase(),
    );
  }

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!isLoggedIn) {
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-base mb-8 hover:underline"
        style={{ ...mono, color: "rgba(58,42,32,0.7)" }}
      >
        <ArrowLeft size={16} /> back
      </button>

      <StampCard>
        <div className="flex items-start justify-between mb-10">
          <div>
            <p
              className="text-sm uppercase tracking-widest mb-2"
              style={{ ...mono, color: C.rustDark }}
            >
              Step one
            </p>
            <h2
              className="text-3xl md:text-4xl"
              style={{ ...display, fontWeight: 600, color: C.ink }}
            >
              Post a file
            </h2>
          </div>
          <StampCircle rotate={12} size="w-20 h-20" text="DROP" sub="ZONE" />
        </div>

        {!file ? (
          <label
            htmlFor="fileInput"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            className="block rounded-lg text-center py-16 px-6 cursor-pointer transition-colors"
            style={{
              border: `2px dashed ${dragOver ? C.rust : C.line}`,
              backgroundColor: dragOver
                ? "rgba(193,64,42,0.05)"
                : "transparent",
            }}
          >
            <Upload
              size={28}
              style={{ color: C.rustDark }}
              className="mx-auto mb-4"
            />
            <p className="text-lg md:text-xl mb-2" style={body}>
              Drag a file here, or{" "}
              <span style={{ color: C.rustDark, textDecoration: "underline" }}>
                browse
              </span>
            </p>
            <p
              className="text-sm tracking-widest"
              style={{ ...mono, color: "rgba(58,42,32,0.55)" }}
            >
              MAX 2GB · ANY FILE TYPE
            </p>
            <input
              ref={inputRef}
              id="fileInput"
              type="file"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </label>
        ) : (
          <div
            className="rounded-lg p-6 md:p-8"
            style={{ border: `1.5px solid ${C.line}` }}
          >
            <div
              className="flex items-center justify-between mb-8 pb-6"
              style={{ borderBottom: `2px dashed ${C.line}` }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-widest mb-1"
                  style={{ ...mono, color: "rgba(58,42,32,0.6)" }}
                >
                  Selected Parcel
                </p>
                <div className="flex items-center gap-3">
                  <p
                    className="text-lg md:text-xl truncate max-w-[200px] md:max-w-[400px]"
                    style={{ ...mono, color: C.ink }}
                  >
                    {file.name}
                  </p>
                  <button
                    onClick={() => {
                      setFile(null);
                      setLink(null);
                    }}
                    className="text-xs hover:underline"
                    style={{ ...mono, color: C.rust }}
                  >
                    change
                  </button>
                </div>
              </div>
              <span
                className="text-sm px-3 py-1.5 rounded"
                style={{
                  ...mono,
                  backgroundColor: "rgba(58,42,32,0.08)",
                  color: C.ink,
                }}
              >
                {formatSize(file.size)}
              </span>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Settings2 size={18} style={{ color: C.rustDark }} />
                <h3
                  className="text-xl"
                  style={{ ...display, fontWeight: 600, color: C.ink }}
                >
                  Delivery Options
                </h3>
              </div>

              <div className="flex flex-col gap-1">
                <SettingToggle
                  label="Private (Invite Only)"
                  checked={isPrivate}
                  onChange={setIsPrivate}
                />

                <SettingToggle
                  label="Password Protected"
                  checked={hasPassword}
                  onChange={setHasPassword}
                />
                {hasPassword && (
                  <div
                    className="pl-5 py-4 mb-2 border-l-2 ml-1"
                    style={{ borderColor: C.rust }}
                  >
                    <input
                      type="text"
                      placeholder="Enter a secure password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-base pb-1.5"
                      style={{
                        borderBottom: `1.5px solid ${C.ink}`,
                        ...mono,
                        color: C.ink,
                      }}
                    />
                  </div>
                )}

                <SettingToggle
                  label="Send Anonymously"
                  checked={isAnonymous}
                  onChange={setIsAnonymous}
                />

                <SettingToggle
                  label="Set Expiry Date"
                  checked={hasExpiry}
                  onChange={setHasExpiry}
                />
                {hasExpiry && (
                  <div
                    className="pl-5 py-4 mb-2 border-l-2 ml-1 flex flex-col sm:flex-row gap-6"
                    style={{ borderColor: C.rust }}
                  >
                    <div className="flex-1">
                      <label
                        className="block text-xs uppercase tracking-widest mb-2"
                        style={{ ...mono, color: "rgba(58,42,32,0.6)" }}
                      >
                        Date
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full bg-transparent outline-none text-base pb-1.5 cursor-pointer"
                        style={{
                          borderBottom: `1.5px solid ${C.ink}`,
                          ...mono,
                          color: C.ink,
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        className="block text-xs uppercase tracking-widest mb-2"
                        style={{ ...mono, color: "rgba(58,42,32,0.6)" }}
                      >
                        Time
                      </label>
                      <input
                        type="time"
                        value={expiryTime}
                        onChange={(e) => setExpiryTime(e.target.value)}
                        className="w-full bg-transparent outline-none text-base pb-1.5 cursor-pointer"
                        style={{
                          borderBottom: `1.5px solid ${C.ink}`,
                          ...mono,
                          color: C.ink,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={generateLink}
              className="w-full mt-2 py-4 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
              style={{
                ...mono,
                backgroundColor: C.ink,
                color: C.paper,
                fontSize: "15px",
              }}
            >
              Stamp & Send <ArrowRight size={16} />
            </button>
          </div>
        )}

        {link && (
          <div
            className="mt-12 pt-10"
            style={{ borderTop: `1.5px dashed ${C.line}` }}
          >
            <div className="flex items-center justify-between mb-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  border: `2px solid ${C.rust}`,
                  transform: "rotate(-8deg)",
                }}
              >
                <span
                  className="text-[10px] font-bold uppercase text-center leading-tight tracking-wider"
                  style={{ ...mono, color: C.rust }}
                >
                  Delivered
                  <br />
                  {stampDate}
                </span>
              </div>
              <span
                className="text-sm uppercase tracking-widest"
                style={{ ...mono, color: "rgba(58,42,32,0.6)" }}
              >
                Your parcel is ready
              </span>
            </div>
            <div
              className="flex items-center gap-4 rounded-lg px-6 py-4"
              style={{
                border: `1.5px solid ${C.line}`,
                backgroundColor: "rgba(58,42,32,0.04)",
              }}
            >
              <span
                className="flex-1 text-base md:text-lg overflow-x-auto whitespace-nowrap"
                style={{ ...mono, color: C.rustDark }}
              >
                {link}
              </span>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 text-sm px-5 py-2.5 rounded hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ ...mono, backgroundColor: C.ink, color: C.paper }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "copied" : "copy"}
              </button>
            </div>
          </div>
        )}
      </StampCard>
    </div>
  );
}
