import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2, ExternalLink } from "lucide-react";
import { C, display, mono } from "../theme";
import { StampCard } from "../components/StampCard";
import { StampCircle } from "../components/StampCircle";
import { LoginPrompt } from "../components/LoginPrompt";
import { Modal } from "../components/Modal";

export function ProfilePage({ isLoggedIn, user }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { id } or 'all'
  const [alertDialog, setAlertDialog] = useState(""); // Error message
  
  const userEmail = user?.user?.email || user?.email || "";
  const role = user?.user?.role || user?.role || "Sender";
  const userId = user?.user?.id || user?.id || "";

  useEffect(() => {
    if (!isLoggedIn) return;

    async function fetchFiles() {
      try {
        const token = user?.access_token;
        const res = await fetch("/api/files/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch your parcels");
        }
        
        const data = await res.json();
        // filter out deleted ones if backend returns them
        setFiles(data.filter(f => !f.is_deleted).sort((a, b) => new Date(b.created_on) - new Date(a.created_on)));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFiles();
  }, [isLoggedIn, user]);

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async function handleDeleteConfirm(id) {
    setConfirmDialog(null);
    setDeletingId(id);
    try {
      const token = user?.access_token;
      const res = await fetch(`/api/files/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete parcel");
      }

      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setAlertDialog(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteAllConfirm() {
    setConfirmDialog(null);
    setIsDeletingAll(true);
    try {
      const token = user?.access_token;
      const res = await fetch("/api/files/", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete all parcels");
      }

      setFiles([]);
    } catch (err) {
      setAlertDialog(err.message);
    } finally {
      setIsDeletingAll(false);
    }
  }

  function promptDelete(id) {
    setConfirmDialog({ id });
  }

  if (!isLoggedIn) {
    return <LoginPrompt />;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-base mb-8 hover:underline"
        style={{ ...mono, color: "rgba(58,42,32,0.7)" }}
      >
        <ArrowLeft size={16} /> back
      </button>

      <div className="mb-12">
        <h1 className="text-2xl font-bold mb-2" style={{ ...display, color: C.ink }}>Account Details</h1>
        <div className="rounded-lg p-6 flex flex-col gap-3" style={{ border: `1.5px solid ${C.line}`, backgroundColor: C.paper }}>
          <div className="flex items-center gap-4 text-sm" style={mono}>
            <span style={{ color: "rgba(58,42,32,0.6)", width: "80px" }}>Email:</span>
            <span style={{ color: C.ink }}>{userEmail}</span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={mono}>
            <span style={{ color: "rgba(58,42,32,0.6)", width: "80px" }}>Role:</span>
            <span style={{ color: C.ink }} className="capitalize">{role}</span>
          </div>
          {userId && (
            <div className="flex items-center gap-4 text-sm" style={mono}>
              <span style={{ color: "rgba(58,42,32,0.6)", width: "80px" }}>User ID:</span>
              <span style={{ color: C.ink }}>{userId}</span>
            </div>
          )}
        </div>
      </div>

      <StampCard>
        <div className="flex items-start justify-between mb-10">
          <div>
            <p
              className="text-sm uppercase tracking-widest mb-2"
              style={{ ...mono, color: C.rustDark }}
            >
              Your History
            </p>
            <h2
              className="text-3xl md:text-4xl"
              style={{ ...display, fontWeight: 600, color: C.ink }}
            >
              Sent Parcels
            </h2>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StampCircle rotate={-8} size="w-20 h-20" text="SNDR" sub="LOG" />
            {files.length > 0 && !isLoading && (
              <button
                onClick={() => setConfirmDialog('all')}
                disabled={isDeletingAll}
                className="text-xs px-3 py-1.5 rounded transition-colors hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                style={{ ...mono, color: C.rustDark, border: `1px solid ${C.rustDark}` }}
              >
                {isDeletingAll ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete All
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: C.rust }} />
            <p style={{ ...mono, color: C.ink }} className="text-sm uppercase tracking-widest">
              Fetching records...
            </p>
          </div>
        ) : error ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ border: `1.5px dashed ${C.line}` }}
          >
            <p style={{ ...mono, color: C.rustDark }}>{error}</p>
          </div>
        ) : files.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{ border: `1.5px dashed ${C.line}` }}
          >
            <p style={{ ...mono, color: "rgba(58,42,32,0.6)" }} className="mb-6">
              You haven't sent any parcels yet.
            </p>
            <Link
              to="/upload"
              className="inline-flex px-6 py-3 rounded hover:opacity-90 transition-opacity"
              style={{ ...mono, backgroundColor: C.ink, color: C.paper }}
            >
              Send your first parcel
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="rounded-lg p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                style={{ border: `1.5px solid ${C.line}`, backgroundColor: "rgba(255,255,255,0.4)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p
                      className="text-lg truncate font-medium"
                      style={{ ...mono, color: C.ink }}
                      title={file.filename}
                    >
                      {file.filename}
                    </p>
                    <span
                      className="text-xs px-2 py-1 rounded whitespace-nowrap"
                      style={{
                        ...mono,
                        backgroundColor: "rgba(58,42,32,0.08)",
                        color: C.ink,
                      }}
                    >
                      {formatSize(file.filesize || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ ...mono, color: "rgba(58,42,32,0.6)" }}>
                    <span>{new Date(file.created_on).toLocaleDateString()}</span>
                    {file.is_expired && <span style={{ color: C.rustDark }}>Expired</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <Link
                    to={`/p/${file.id}`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 rounded text-sm hover:bg-black/5 transition-colors"
                    style={{ ...mono, color: C.ink, border: `1px solid ${C.line}` }}
                  >
                    View <ExternalLink size={14} />
                  </Link>
                  <button
                    onClick={() => promptDelete(file.id)}
                    disabled={deletingId === file.id}
                    className="flex items-center justify-center p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                    style={{ color: C.rustDark }}
                    title="Delete Parcel"
                  >
                    {deletingId === file.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </StampCard>

      <Modal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog === 'all' ? "Delete All Parcels" : "Delete Parcel"}
        actions={
          <>
            <button
              onClick={() => setConfirmDialog(null)}
              className="px-4 py-2 rounded transition-colors hover:bg-black/5"
              style={{ ...mono, color: C.ink }}
            >
              Cancel
            </button>
            <button
              onClick={() => confirmDialog === 'all' ? handleDeleteAllConfirm() : handleDeleteConfirm(confirmDialog?.id)}
              className="px-4 py-2 rounded transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ ...mono, backgroundColor: C.rustDark, color: C.paper }}
            >
              <Trash2 size={16} />
              {confirmDialog === 'all' ? "Delete All" : "Delete"}
            </button>
          </>
        }
      >
        <p>
          {confirmDialog === 'all' 
            ? "Are you sure you want to permanently delete ALL your parcels? This action cannot be undone."
            : "Are you sure you want to permanently delete this parcel? This action cannot be undone."}
        </p>
      </Modal>

      <Modal
        isOpen={!!alertDialog}
        onClose={() => setAlertDialog("")}
        title="Error"
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
