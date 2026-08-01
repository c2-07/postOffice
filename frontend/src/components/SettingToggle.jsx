import { C, mono } from "../theme";

export function SettingToggle({ label, checked, onChange }) {
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
