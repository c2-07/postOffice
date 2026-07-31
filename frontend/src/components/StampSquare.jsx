import { C, display, mono } from "../theme";

export function StampSquare({ size = "w-40 h-48", compact = false }) {
  return (
    <div
      className={`${size} rotate-5 hover:rotate-0
        rounded-md will-change-transform
        flex flex-col items-center justify-center
        shrink-0 relative
        transition-transform duration-300 ease-out
  `}
      style={{
        backgroundColor: C.rust,
        color: C.paper,
        // transform: `rotate(${rotate}deg)`,
        boxShadow: "0 18px 34px -16px rgba(58,20,10,0.5)",
      }}
    >
      <div
        className="absolute inset-2 rounded-sm"
        style={{ border: "2px dashed rgba(243,233,219,0.55)" }}
      />
      <span
        className={`font-bold uppercase leading-tight ${compact ? "text-[10px]" : "text-2xl"}`}
        style={display}
      >
        Post
      </span>
      <span
        className={`font-bold uppercase leading-tight ${compact ? "text-[10px]" : "text-2xl"}`}
        style={display}
      >
        Office
      </span>
      {!compact && (
        <span
          className="text-[10px] tracking-[0.2em] mt-2 opacity-80"
          style={mono}
        >
          FILE · TRANSFER
        </span>
      )}
    </div>
  );
}
