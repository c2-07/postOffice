import { C, body, mono } from "../theme";

export function LineField({ label, icon: Icon, actionLink, ...props }) {
  return (
    <div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-0 bottom-2">
            <Icon size={18} style={{ color: C.rustDark }} />
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-transparent outline-none text-base pb-1.5 ${Icon ? "pl-8" : ""}`}
          style={{ borderBottom: `1.5px solid ${C.ink}`, ...body }}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <label className="block text-xs uppercase tracking-widest" style={{ ...mono, color: C.rustDark }}>
          {label}
        </label>
        {actionLink && (
          <div className="text-xs tracking-wide" style={{ ...mono }}>
            {actionLink}
          </div>
        )}
      </div>
    </div>
  );
}
