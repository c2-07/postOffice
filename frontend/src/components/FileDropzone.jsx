import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { C, body, mono } from "../theme";

export function FileDropzone({ onFileSelect }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  return (
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
        if (f) onFileSelect(f);
      }}
      className="block rounded-lg text-center py-16 px-6 cursor-pointer transition-colors"
      style={{
        border: `2px dashed ${dragOver ? C.rust : C.line}`,
        backgroundColor: dragOver ? "rgba(193,64,42,0.05)" : "transparent",
      }}
    >
      <Upload size={28} style={{ color: C.rustDark }} className="mx-auto mb-4" />
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
        onChange={(e) => onFileSelect(e.target.files[0])}
      />
    </label>
  );
}
