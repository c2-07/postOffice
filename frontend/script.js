const sections = document.querySelectorAll(".reveal");

function resolveApiBase() {
  const params = new URLSearchParams(window.location.search);
  const queryApiBase = params.get("api_base");
  if (queryApiBase) {
    window.localStorage.setItem("POSTOFFICE_API_BASE", queryApiBase);
    return queryApiBase;
  }

  const configured = window.localStorage.getItem("POSTOFFICE_API_BASE");
  if (configured) return configured;

  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }

  return `${protocol}//${hostname}:8000`;
}

const API_BASE = resolveApiBase();

function connectivityHelp(error) {
  const message = getErrorMessage(error, "Request failed.");
  if (!/Failed to fetch/i.test(message)) return message;

  return "Failed to fetch. Open this URL on mobile with ?api_base=http://YOUR_LAPTOP_IP:8000 and ensure backend runs with --host 0.0.0.0.";
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.style.animationPlayState = "running";
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.15,
  }
);

sections.forEach((section) => {
  section.style.animationPlayState = "paused";
  observer.observe(section);
});

const fileInput = document.querySelector("#file");
const fileName = document.querySelector("#file-name");

if (fileInput && fileName) {
  fileInput.addEventListener("change", () => {
    const pickedFile = fileInput.files ? fileInput.files.item(0) : null;
    const name = pickedFile ? pickedFile.name : "No file selected";
    fileName.textContent = name;
  });
}

const expiryInput = document.querySelector("#expiryAt");
const presetButtons = document.querySelectorAll(".preset-btn");

function setExpiry(hoursAhead) {
  if (!expiryInput) return;
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const target = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  expiryInput.value = target.toISOString().slice(0, 16);
}

if (expiryInput && presetButtons.length > 0) {
  setExpiry(24);

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      presetButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const custom = button.dataset.custom === "true";
      if (custom) {
        expiryInput.focus();
        return;
      }

      const hours = Number(button.dataset.hours || "24");
      setExpiry(hours);
    });
  });
}

function toIsoWithOffset(localDateTime, offset) {
  if (!localDateTime) return "";
  return `${localDateTime}:00${offset}`;
}

function showStatus(element, text, kind) {
  if (!element) return;
  element.hidden = false;
  element.classList.remove("error", "success");
  if (kind) element.classList.add(kind);
  element.textContent = text;
}

function fallbackCopyText(text) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "true");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  helper.style.pointerEvents = "none";
  document.body.appendChild(helper);
  helper.focus();
  helper.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(helper);
  return copied;
}

function parseApiError(data, fallback) {
  if (!data) return fallback;
  const detail = data.detail ?? data.message ?? data.error ?? data;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const first = detail[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      return first.msg || first.message || fallback;
    }
  }

  if (detail && typeof detail === "object") {
    return detail.message || detail.msg || fallback;
  }

  return fallback;
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && typeof error.message === "string") return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

const uploadForm = document.querySelector("#upload-form");
if (uploadForm) {
  const uploadStatus = document.querySelector("#upload-status");
  const uploadResult = document.querySelector("#upload-result");
  const fileLinkNode = document.querySelector("#result-file-link");
  const fileLinkInput = document.querySelector("#result-file-link-input");
  const openPageNode = document.querySelector("#result-open-page");
  const copyLinkNode = document.querySelector("#result-copy-link");

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (uploadResult) uploadResult.hidden = true;

    const selectedCount = fileInput && fileInput.files ? fileInput.files.length : 0;
    const selectedFile = fileInput && fileInput.files ? fileInput.files.item(0) : null;
    const expiryRaw = document.querySelector("#expiryAt")?.value || "";
    const timezoneOffset = document.querySelector("#timezone")?.value || "+00:00";
    const expiryIso = toIsoWithOffset(expiryRaw, timezoneOffset);
    const password = document.querySelector("#password")?.value || "";
    const uploadedBy = document.querySelector("#uploadedBy")?.value || "";

    if (!selectedFile) {
      showStatus(uploadStatus, "Please choose a file first.", "error");
      return;
    }

    if (selectedCount > 1) {
      showStatus(uploadStatus, "Please upload only one file at a time.", "error");
      return;
    }

    if (!expiryIso) {
      showStatus(uploadStatus, "Please set an expiry date and time.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("expiry", expiryIso);
    if (password) formData.append("password", password);
    if (uploadedBy) formData.append("uploaded_by", uploadedBy);

    showStatus(uploadStatus, "Uploading file...", "");

    try {
      const response = await fetch(`${API_BASE}/files/upload`, {
        method: "POST",
        body: formData,
      });

      const raw = await response.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { detail: raw };
      }

      if (!response.ok) {
        throw new Error(parseApiError(data, "Upload failed."));
      }

      const rawPageUrl = data.file_page_url || "";
      let pageUrl = rawPageUrl.replace("/signin.html", "/open-link.html");
      try {
        const urlObj = new URL(pageUrl);
        if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
          urlObj.protocol = window.location.protocol;
          urlObj.host = window.location.host;
          pageUrl = urlObj.toString();
        }
      } catch (e) {}

      if (fileLinkNode) {
        fileLinkNode.textContent = pageUrl || "-";
        fileLinkNode.href = pageUrl || "#";
      }
      if (fileLinkInput) {
        fileLinkInput.value = pageUrl || "";
      }
      if (openPageNode) openPageNode.href = pageUrl || "#";

      if (copyLinkNode) {
        copyLinkNode.onclick = async () => {
          try {
            if (!pageUrl) {
              showStatus(uploadStatus, "No link available to copy.", "error");
              return;
            }

            if (navigator.clipboard && window.isSecureContext) {
              await navigator.clipboard.writeText(pageUrl);
              showStatus(uploadStatus, "Link copied to clipboard.", "success");
              return;
            }

            const copied = fallbackCopyText(pageUrl);
            if (copied) {
              showStatus(uploadStatus, "Link copied to clipboard.", "success");
              return;
            }

            if (fileLinkInput) {
              fileLinkInput.focus();
              fileLinkInput.select();
              showStatus(uploadStatus, "Auto-copy blocked on this device. Link selected, long-press and copy.", "error");
              return;
            }

            showStatus(uploadStatus, `Copy this link manually: ${pageUrl}`, "error");
          } catch {
            const copied = pageUrl ? fallbackCopyText(pageUrl) : false;
            if (copied) {
              showStatus(uploadStatus, "Link copied to clipboard.", "success");
            } else {
              if (fileLinkInput) {
                fileLinkInput.focus();
                fileLinkInput.select();
                showStatus(uploadStatus, "Auto-copy blocked on this device. Link selected, long-press and copy.", "error");
              } else {
                showStatus(uploadStatus, `Copy this link manually: ${pageUrl || "-"}`, "error");
              }
            }
          }
        };
      }

      if (uploadResult) uploadResult.hidden = false;
      showStatus(uploadStatus, "Upload successful.", "success");
      uploadForm.reset();
      if (fileName) fileName.textContent = "No file selected";
      setExpiry(24);
      presetButtons.forEach((btn) => btn.classList.remove("active"));
      const firstPreset = document.querySelector(".preset-btn[data-hours='24']");
      if (firstPreset) firstPreset.classList.add("active");
    } catch (error) {
      showStatus(uploadStatus, connectivityHelp(error), "error");
    }
  });
}

function extractFileId(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const queryId = url.searchParams.get("file");
    if (queryId) return queryId.trim();

    const urlParts = url.pathname.split("/").filter(Boolean);
    const filesIndex = urlParts.findIndex((part) => part === "files");
    if (filesIndex !== -1) return urlParts[filesIndex + 1] || "";
  } catch {
    // Not a full URL; continue with non-URL parsing.
  }

  if (trimmed.includes("?")) {
    const query = trimmed.split("?")[1] || "";
    const queryId = new URLSearchParams(query).get("file");
    if (queryId) return queryId.trim();
  }

  if (!trimmed.includes("/")) return trimmed;

  const parts = trimmed.split("/").filter(Boolean);
  const filesIndex = parts.findIndex((part) => part === "files");
  if (filesIndex === -1) return parts[parts.length - 1] || "";
  return parts[filesIndex + 1] || "";
}

function getFileIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("file") || "";
}

const linkForm = document.querySelector("#link-form");
if (linkForm) {
  const linkStatus = document.querySelector("#link-status");
  const linkResult = document.querySelector("#link-result");

  const previewFilename = document.querySelector("#preview-filename");
  const previewUploader = document.querySelector("#preview-uploader");
  const previewType = document.querySelector("#preview-type");
  const previewSize = document.querySelector("#preview-size");
  const previewExpiry = document.querySelector("#preview-expiry");
  const previewStatus = document.querySelector("#preview-status");
  const previewDownload = document.querySelector("#preview-download");
  let lastFileId = "";
  let lastPassword = "";
  let metadataLoaded = false;

  if (previewDownload) {
    previewDownload.hidden = true;
    previewDownload.addEventListener("click", (event) => {
      if (!metadataLoaded || !lastFileId) {
        event.preventDefault();
        showStatus(linkStatus, "Please click Show Metadata first.", "error");
        return;
      }

      const passwordSuffix = lastPassword
        ? `?password=${encodeURIComponent(lastPassword)}`
        : "";
      previewDownload.href = `${API_BASE}/files/${lastFileId}/download${passwordSuffix}`;
    });
  }

  async function fetchFileDetails(event) {
    if (event) event.preventDefault();
    metadataLoaded = false;
    lastFileId = "";
    lastPassword = "";
    if (linkResult) linkResult.hidden = true;
    if (previewDownload) previewDownload.hidden = true;

    if (previewFilename) previewFilename.textContent = "-";
    if (previewUploader) previewUploader.textContent = "-";
    if (previewType) previewType.textContent = "-";
    if (previewSize) previewSize.textContent = "-";
    if (previewExpiry) previewExpiry.textContent = "-";
    if (previewStatus) previewStatus.textContent = "-";

    const fileRef = document.querySelector("#fileRef")?.value || "";
    const password = document.querySelector("#filePassword")?.value || "";
    const fileId = extractFileId(fileRef);

    if (!fileId) {
      showStatus(linkStatus, "Please provide a valid file link or ID.", "error");
      return;
    }

    showStatus(linkStatus, "Fetching file details...", "");

    try {
      const passwordQuery = password ? `?password=${encodeURIComponent(password)}` : "";
      const response = await fetch(`${API_BASE}/files/${fileId}${passwordQuery}`);
      const raw = await response.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { detail: raw };
      }

      if (data && typeof data === "object" && data.detail && !data.filename) {
        throw new Error(parseApiError(data, "Could not fetch file details."));
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Enter the correct password to show metadata and download the file.");
        }
        throw new Error(parseApiError(data, "Could not fetch file details."));
      }

      if (previewFilename) previewFilename.textContent = data.filename || "Unknown";
      if (previewUploader) previewUploader.textContent = data.uploaded_by || "Anonymous";
      if (previewType) previewType.textContent = data.content_type || "Unknown";
      if (previewSize) previewSize.textContent = data.filesize != null ? String(data.filesize) : "Unknown";
      if (previewExpiry) {
        previewExpiry.textContent = data.expiry_date ? new Date(data.expiry_date).toLocaleString() : "No expiry";
      }
      if (previewStatus) previewStatus.textContent = data.is_expired ? "Expired" : "Active";

      if (previewDownload) {
        previewDownload.href = "#";
        previewDownload.style.color = "#f5f5f5";
        previewDownload.hidden = false;
      }

      lastFileId = fileId;
      lastPassword = password;
      metadataLoaded = true;

      if (linkResult) linkResult.hidden = false;
      showStatus(linkStatus, "Metadata loaded. You can now download the file.", "success");
    } catch (error) {
      showStatus(linkStatus, connectivityHelp(error), "error");
    }
  }

  linkForm.addEventListener("submit", fetchFileDetails);

  const fileFromUrl = getFileIdFromQuery();
  if (fileFromUrl) {
    const fileRefInput = document.querySelector("#fileRef");
    if (fileRefInput) fileRefInput.value = fileFromUrl;
    fetchFileDetails();
  }
}
