import { C, mono } from "../theme";

export function StampCircle({ rotate = 0, size = "w-24 h-24", text = "POST", sub = "OFFICE" }) {
  return (
    <div
      className={`${size} rounded-full flex flex-col items-center justify-center flex-shrink-0 transition-transform`}
      style={{
        border: `2.5px solid ${C.rust}`,
        transform: `rotate(${rotate}deg)`,
        backgroundColor: "transparent",
      }}
    >
      <div className="w-full h-full rounded-full flex flex-col items-center justify-center" style={{ border: `1px solid ${C.rust}`, padding: "4px" }}>
        <div className="w-full h-full rounded-full flex flex-col items-center justify-center" style={{ border: `1px dashed ${C.rust}` }}>
          <span className="font-bold uppercase text-center leading-none tracking-widest" style={{ ...mono, color: C.rust, fontSize: "11px" }}>
            {text}
          </span>
          <span className="uppercase text-center leading-none tracking-widest mt-1" style={{ ...mono, color: C.rust, fontSize: "9px", opacity: 0.8 }}>
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}
