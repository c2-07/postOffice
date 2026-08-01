import { Settings2 } from "lucide-react";
import { C, display, mono } from "../theme";
import { SettingToggle } from "./SettingToggle";

export function DeliveryOptions({
  isPrivate,
  setIsPrivate,
  hasPassword,
  setHasPassword,
  password,
  setPassword,
  isAnonymous,
  setIsAnonymous,
  hasExpiry,
  setHasExpiry,
  expiryDate,
  setExpiryDate,
  expiryTime,
  setExpiryTime,
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings2 size={18} style={{ color: C.rustDark }} />
        <h3 className="text-xl" style={{ ...display, fontWeight: 600, color: C.ink }}>
          Delivery Options
        </h3>
      </div>

      <div className="flex flex-col gap-1">
        <SettingToggle label="Private (Invite Only)" checked={isPrivate} onChange={setIsPrivate} />

        <SettingToggle label="Password Protected" checked={hasPassword} onChange={setHasPassword} />
        {hasPassword && (
          <div className="pl-5 py-4 mb-2 border-l-2 ml-1" style={{ borderColor: C.rust }}>
            <input
              type="text"
              placeholder="Enter a secure password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-base pb-1.5"
              style={{
                borderBottom: `1.5px solid ${C.ink}`,
                ...mono,
                color: C.ink,
              }}
            />
          </div>
        )}

        <SettingToggle label="Send Anonymously" checked={isAnonymous} onChange={setIsAnonymous} />

        <SettingToggle label="Set Expiry Date" checked={hasExpiry} onChange={setHasExpiry} />
        {hasExpiry && (
          <div
            className="pl-5 py-4 mb-2 border-l-2 ml-1 flex flex-col sm:flex-row gap-6"
            style={{ borderColor: C.rust }}
          >
            <div className="flex-1">
              <label
                className="block text-xs uppercase tracking-widest mb-2"
                style={{ ...mono, color: "rgba(58,42,32,0.6)" }}
              >
                Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-transparent outline-none text-base pb-1.5 cursor-pointer"
                style={{
                  borderBottom: `1.5px solid ${C.ink}`,
                  ...mono,
                  color: C.ink,
                }}
              />
            </div>
            <div className="flex-1">
              <label
                className="block text-xs uppercase tracking-widest mb-2"
                style={{ ...mono, color: "rgba(58,42,32,0.6)" }}
              >
                Time
              </label>
              <input
                type="time"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                className="w-full bg-transparent outline-none text-base pb-1.5 cursor-pointer"
                style={{
                  borderBottom: `1.5px solid ${C.ink}`,
                  ...mono,
                  color: C.ink,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
