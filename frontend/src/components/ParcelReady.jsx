import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { C, mono } from "../theme";

export function ParcelReady({ link, stampDate }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="mt-12 pt-10" style={{ borderTop: `1.5px dashed ${C.line}` }}>
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
  );
}
