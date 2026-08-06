import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { C, display, mono } from "../theme";
import { StampCard } from "../components/StampCard";
import { StampCircle } from "../components/StampCircle";

import { LoginPrompt } from "../components/LoginPrompt";
import { FileDropzone } from "../components/FileDropzone";
import { DeliveryOptions } from "../components/DeliveryOptions";
import { ParcelReady } from "../components/ParcelReady";

export function UploadPage({ isLoggedIn, user }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [link, setLink] = useState(null);
  const [stampDate, setStampDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

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

  async function uploadFile() {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // If backend later supports these options, you'd append them too
      // formData.append("is_private", isPrivate);
      // formData.append("has_password", hasPassword);

      const token = user?.access_token;

      const res = await fetch("/api/files/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.detail?.[0]?.msg || data?.detail || "Upload failed",
        );
      }

      const data = await res.json().catch(() => ({}));
      const fileId = data.id;

      setLink(window.location.origin + "/p/" + fileId);

      const d = new Date();
      setStampDate(
        d
          .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
          .toUpperCase(),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  if (!isLoggedIn) {
    return <LoginPrompt />;
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
          <FileDropzone
            onFileSelect={(f) => {
              setFile(f);
              setLink(null);
              setError("");
            }}
          />
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
                    className="text-lg md:text-xl truncate max-w-50 md:max-w-100"
                    style={{ ...mono, color: C.ink }}
                  >
                    {file.name}
                  </p>
                  <button
                    onClick={() => {
                      setFile(null);
                      setLink(null);
                      setError("");
                    }}
                    className="text-xs hover:underline"
                    style={{ ...mono, color: C.rust }}
                    disabled={isUploading}
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

            <DeliveryOptions
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
              hasPassword={hasPassword}
              setHasPassword={setHasPassword}
              password={password}
              setPassword={setPassword}
              isAnonymous={isAnonymous}
              setIsAnonymous={setIsAnonymous}
              hasExpiry={hasExpiry}
              setHasExpiry={setHasExpiry}
              expiryDate={expiryDate}
              setExpiryDate={setExpiryDate}
              expiryTime={expiryTime}
              setExpiryTime={setExpiryTime}
            />

            {error && (
              <div
                className="mb-4 p-3 rounded text-sm"
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
              onClick={uploadFile}
              disabled={isUploading}
              className="w-full mt-2 py-4 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-3 disabled:opacity-50"
              style={{
                ...mono,
                backgroundColor: C.ink,
                color: C.paper,
                fontSize: "15px",
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Stamping...
                </>
              ) : (
                <>
                  Stamp & Send <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {link && <ParcelReady link={link} stampDate={stampDate} />}
      </StampCard>
    </div>
  );
}
