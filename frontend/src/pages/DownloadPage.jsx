import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Download } from "lucide-react";
import { C, display, mono } from "../theme";
import { StampCard } from "../components/StampCard";
import { StampCircle } from "../components/StampCircle";
import { Modal } from "../components/Modal";

export function DownloadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fileDetails, setFileDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [alertDialog, setAlertDialog] = useState(""); // Error message

  useEffect(() => {
    // In a real app, this would fetch the file details from the backend
    // Since the backend might not have the public endpoint yet, 
    // we'll simulate fetching data for the download page.
    async function fetchFileDetails() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/files/public/${id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || "File not found or expired");
        }
        
        const data = await res.json();
        setFileDetails(data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load file details");
        setIsLoading(false);
      }
    }

    fetchFileDetails();
  }, [id]);

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async function downloadFile() {
    setIsDownloading(true);
    try {
      // Redirect to the download URL
      window.location.href = fileDetails.download_url;
      setIsDownloading(false);
    } catch (err) {
      setAlertDialog("Failed to download: " + err.message);
      setIsDownloading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-base mb-8 hover:underline"
        style={{ ...mono, color: "rgba(58,42,32,0.7)" }}
      >
        <ArrowLeft size={16} /> home
      </button>

      <StampCard>
        <div className="flex items-start justify-between mb-10">
          <div>
            <p
              className="text-sm uppercase tracking-widest mb-2"
              style={{ ...mono, color: C.rustDark }}
            >
              Incoming Parcel
            </p>
            <h2
              className="text-3xl md:text-4xl"
              style={{ ...display, fontWeight: 600, color: C.ink }}
            >
              Collect File
            </h2>
          </div>
          <StampCircle rotate={-15} size="w-20 h-20" text="RCVD" sub="FILE" />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: C.rust }} />
            <p style={{ ...mono, color: C.ink }} className="text-sm uppercase tracking-widest">
              Locating parcel...
            </p>
          </div>
        ) : error ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ border: `1.5px dashed ${C.line}` }}
          >
            <p style={{ ...mono, color: C.rustDark }} className="mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate("/")}
              className="text-sm underline"
              style={{ ...mono, color: C.ink }}
            >
              Return to home
            </button>
          </div>
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
                  Parcel Contents
                </p>
                <div className="flex items-center gap-3">
                  <p
                    className="text-lg md:text-xl truncate max-w-50 md:max-w-100"
                    style={{ ...mono, color: C.ink }}
                    title={fileDetails?.filename}
                  >
                    {fileDetails?.filename}
                  </p>
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
                {formatSize(fileDetails?.filesize || 0)}
              </span>
            </div>

            <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center text-sm" style={{ ...mono, color: "rgba(58,42,32,0.7)" }}>
                 <span>ID</span>
                 <span className="truncate max-w-[200px]" style={{ color: C.ink }}>{fileDetails?.id}</span>
               </div>
               <div className="flex justify-between items-center text-sm" style={{ ...mono, color: "rgba(58,42,32,0.7)" }}>
                 <span>Date</span>
                 <span style={{ color: C.ink }}>
                   {new Date(fileDetails?.created_on).toLocaleDateString()}
                 </span>
               </div>
            </div>

            <button
              onClick={downloadFile}
              disabled={isDownloading}
              className="w-full mt-2 py-4 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-3 disabled:opacity-50"
              style={{
                ...mono,
                backgroundColor: C.ink,
                color: C.paper,
                fontSize: "15px",
              }}
            >
              {isDownloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Unpacking...
                </>
              ) : (
                <>
                  Download Parcel <Download size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </StampCard>

      <Modal
        isOpen={!!alertDialog}
        onClose={() => setAlertDialog("")}
        title="Download Error"
        actions={
          <button
            onClick={() => setAlertDialog("")}
            className="px-4 py-2 rounded transition-opacity hover:opacity-90"
            style={{ ...mono, backgroundColor: C.ink, color: C.paper }}
          >
            Okay
          </button>
        }
      >
        <p>{alertDialog}</p>
      </Modal>
    </div>
  );
}
