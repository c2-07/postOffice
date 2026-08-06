import { Package, ShieldCheck, Clock, Code } from "lucide-react";
import { C, body } from "../theme";

export function Creed() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
      {[
        {
          icon: Package,
          text: "Every file arrives exactly as it was sent.",
        },
        {
          icon: ShieldCheck,
          text: "Sign in once, then send freely — no clutter beyond that.",
        },
        {
          icon: Clock,
          text: "Links expire, so nothing lingers on the server forever.",
        },
        {
          icon: Code,
          text: "Open source, self-hostable, and yours to run.",
        },
      ].map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(193,64,42,0.12)" }}
          >
            <Icon size={18} style={{ color: C.rust }} />
          </div>
          <p
            className="text-lg pt-1.5 leading-relaxed"
            style={{ ...body, color: C.ink }}
          >
            {text}
          </p>
        </div>
      ))}
    </div>
  );
}
