const isLocalDevFrontend =
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
  window.location.port === "3000";

const API_BASE = isLocalDevFrontend ? "http://localhost/api" : "/api";
const DEFAULT_COPY_LABEL = "Copy Link";

const $ = (selector) => document.querySelector(selector);

function showStatus(node, text, kind = "") {
  if (!node) return;
  node.hidden = false;
  node.classList.remove("error", "success");
  if (kind) node.classList.add(kind);
  node.textContent = text;
}

function parseJsonSafely(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { detail: raw };
  }
}

function parseApiError(data, fallback) {
  if (!data) return fallback;
  const detail = data.detail ?? data.message ?? data.error ?? data;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.msg || first.message || fallback;
  }
  if (detail && typeof detail === "object") return detail.message || detail.msg || fallback;
  return fallback;
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && typeof error.message === "string") return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

function connectivityHelp(error) {
  const message = getErrorMessage(error, "Request failed.");
  if (!/Failed to fetch|Load failed|NetworkError/i.test(message)) return message;
  return "Failed to fetch. Please ensure nginx and backend are running.";
}

function toIsoWithOffset(localDateTime, offset) {
  if (!localDateTime) return "";
  return `${localDateTime}:00${offset}`;
}

async function readJsonResponse(response) {
  const raw = await response.text();
  return parseJsonSafely(raw);
}

function buildPublicOpenLink(fileId) {
  if (!fileId) return "";
  return `${window.location.origin}/open-link.html?file=${encodeURIComponent(fileId)}`;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

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

function setupRevealAnimations() {
  const sections = document.querySelectorAll(".reveal");
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.animationPlayState = "running";
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  sections.forEach((section) => {
    section.style.animationPlayState = "paused";
    observer.observe(section);
  });
}

function setupUploadForm() {
  const form = $("#upload-form");
  if (!form) return;

  const fileInput = $("#file");
  const fileName = $("#file-name");
  const expiryInput = $("#expiryAt");
  const timezoneInput = $("#timezone");
  const presetButtons = document.querySelectorAll(".preset-btn");
  const status = $("#upload-status");
  const result = $("#upload-result");
  const copyBtn = $("#result-copy-link");
  const openPageBtn = $("#result-open-page");

  let latestShareUrl = "";

  function setExpiry(hoursAhead) {
    if (!expiryInput) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const target = new Date(now.getTime() + hoursAhead * 3600000);
    expiryInput.value = target.toISOString().slice(0, 16);
  }

  function resetPresets() {
    presetButtons.forEach((btn) => btn.classList.remove("active"));
    const defaultPreset = document.querySelector(".preset-btn[data-hours='24']");
    if (defaultPreset) defaultPreset.classList.add("active");
  }

  function clearResult() {
    latestShareUrl = "";
    if (result) result.hidden = true;
    if (openPageBtn) openPageBtn.href = "#";
    if (copyBtn) copyBtn.textContent = DEFAULT_COPY_LABEL;
  }

  async function copyShareLink() {
    if (!latestShareUrl) {
      showStatus(status, "No link available to copy.", "error");
      return;
    }

    const copied = await copyText(latestShareUrl);
    if (!copied) {
      showStatus(status, `Copy this link manually: ${latestShareUrl}`, "error");
      return;
    }

    if (copyBtn) {
      copyBtn.textContent = "Copied";
      window.setTimeout(() => {
        copyBtn.textContent = DEFAULT_COPY_LABEL;
      }, 1400);
    }
    showStatus(status, "Link copied to clipboard.", "success");
  }

  if (fileInput && fileName) {
    fileInput.addEventListener("change", () => {
      const selected = fileInput.files?.item(0);
      fileName.textContent = selected ? selected.name : "No file selected";
    });
  }

  if (expiryInput && presetButtons.length) {
    setExpiry(24);
    presetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        presetButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        if (button.dataset.custom === "true") {
          expiryInput.focus();
          return;
        }
        setExpiry(Number(button.dataset.hours || "24"));
      });
    });
  }

  if (copyBtn) copyBtn.addEventListener("click", copyShareLink);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearResult();

    const selectedFile = fileInput?.files?.item(0) || null;
    const selectedCount = fileInput?.files?.length || 0;
    const expiryIso = toIsoWithOffset(expiryInput?.value || "", timezoneInput?.value || "+00:00");
    const password = $("#password")?.value || "";
    const uploadedBy = $("#uploadedBy")?.value || "";

    if (!selectedFile) return showStatus(status, "Please choose a file first.", "error");
    if (selectedCount > 1) return showStatus(status, "Please upload only one file at a time.", "error");
    if (!expiryIso) return showStatus(status, "Please set an expiry date and time.", "error");

    showStatus(status, "Uploading file...", "");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("expiry", expiryIso);
    if (password) formData.append("password", password);
    if (uploadedBy) formData.append("uploaded_by", uploadedBy);

    try {
      const response = await fetch(`${API_BASE}/files/upload`, { method: "POST", body: formData });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(parseApiError(data, "Upload failed."));

      const shareId = new URL(data.file_page_url || window.location.href).searchParams.get("file") || "";
      latestShareUrl = buildPublicOpenLink(shareId);
      if (!latestShareUrl) throw new Error("Upload succeeded but no file id was returned.");

      if (openPageBtn) openPageBtn.href = latestShareUrl;
      if (result) result.hidden = false;
      showStatus(status, "Upload successful.", "success");

      form.reset();
      if (fileName) fileName.textContent = "No file selected";
      setExpiry(24);
      resetPresets();
    } catch (error) {
      showStatus(status, connectivityHelp(error), "error");
    }
  });
}

function extractFileId(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const queryId = parsed.searchParams.get("file");
    if (queryId) return queryId.trim();

    const parts = parsed.pathname.split("/").filter(Boolean);
    const filesIndex = parts.indexOf("files");
    if (filesIndex !== -1) return parts[filesIndex + 1] || "";
  } catch {
    // continue
  }

  if (trimmed.includes("?")) {
    const query = trimmed.split("?")[1] || "";
    const queryId = new URLSearchParams(query).get("file");
    if (queryId) return queryId.trim();
  }

  const parts = trimmed.split("/").filter(Boolean);
  if (!parts.length) return "";
  const filesIndex = parts.indexOf("files");
  return filesIndex === -1 ? parts[parts.length - 1] || "" : parts[filesIndex + 1] || "";
}

function setupOpenLinkForm() {
  const form = $("#link-form");
  if (!form) return;

  const status = $("#link-status");
  const result = $("#link-result");
  const previewFilename = $("#preview-filename");
  const previewUploader = $("#preview-uploader");
  const previewType = $("#preview-type");
  const previewSize = $("#preview-size");
  const previewExpiry = $("#preview-expiry");
  const previewState = $("#preview-status");
  const previewDownload = $("#preview-download");

  const previewFields = [previewFilename, previewUploader, previewType, previewSize, previewExpiry, previewState];

  let lastFileId = "";
  let lastPassword = "";
  let readyToDownload = false;

  function resetPreview() {
    readyToDownload = false;
    lastFileId = "";
    lastPassword = "";
    if (result) result.hidden = true;
    if (previewDownload) previewDownload.hidden = true;
    previewFields.forEach((field) => {
      if (field) field.textContent = "-";
    });
  }

  if (previewDownload) {
    previewDownload.hidden = true;
    previewDownload.addEventListener("click", (event) => {
      if (!readyToDownload || !lastFileId) {
        event.preventDefault();
        showStatus(status, "Please click Show Metadata first.", "error");
        return;
      }

      const passwordSuffix = lastPassword ? `?password=${encodeURIComponent(lastPassword)}` : "";
      previewDownload.href = `${API_BASE}/files/${lastFileId}/download${passwordSuffix}`;
    });
  }

  async function fetchFileDetails(event) {
    if (event) event.preventDefault();
    resetPreview();

    const fileRef = $("#fileRef")?.value || "";
    const password = $("#filePassword")?.value || "";
    const fileId = extractFileId(fileRef);

    if (!fileId) {
      showStatus(status, "Please provide a valid file link or ID.", "error");
      return;
    }

    showStatus(status, "Fetching file details...", "");

    try {
      const passwordQuery = password ? `?password=${encodeURIComponent(password)}` : "";
      const response = await fetch(`${API_BASE}/files/${fileId}${passwordQuery}`);
      const data = await readJsonResponse(response);

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
      if (previewState) previewState.textContent = data.is_expired ? "Expired" : "Active";

      if (previewDownload) {
        previewDownload.href = "#";
        previewDownload.hidden = false;
      }

      lastFileId = fileId;
      lastPassword = password;
      readyToDownload = true;

      if (result) result.hidden = false;
      showStatus(status, "Metadata loaded. You can now download the file.", "success");
    } catch (error) {
      showStatus(status, connectivityHelp(error), "error");
    }
  }

  form.addEventListener("submit", fetchFileDetails);

  const fileFromQuery = new URLSearchParams(window.location.search).get("file") || "";
  if (fileFromQuery) {
    const input = $("#fileRef");
    if (input) input.value = fileFromQuery;
    fetchFileDetails();
  }
}

setupRevealAnimations();
setupUploadForm();
setupOpenLinkForm();
