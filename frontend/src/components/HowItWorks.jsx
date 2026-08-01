import { Package, Link2, Send } from "lucide-react";
import { C, display, body, mono } from "../theme";

export function HowItWorks() {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative" style={{ zIndex: 1 }}>
        {[
          {
            icon: Package,
            num: "01",
            title: "Upload",
            desc: "Your file is stored and given a unique parcel ID.",
          },
          {
            icon: Link2,
            num: "02",
            title: "Get the link",
            desc: "A short link is minted the moment the upload finishes.",
          },
          {
            icon: Send,
            num: "03",
            title: "Share",
            desc: "Send the link anywhere. The other side downloads directly.",
          },
        ].map(({ icon: Icon, num, title, desc }) => (
          <div key={num} className="text-center md:text-left" style={{ backgroundColor: C.paper }}>
            <div
              className="hover:scale-110 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0 transition-transform"
              style={{
                backgroundColor: C.rust,
                boxShadow: "0 10px 20px -10px rgba(58,20,10,0.45)",
              }}
            >
              <Icon size={24} color={C.paper} />
            </div>
            <span className="block text-sm mb-2 ml-1.5 tracking-widest" style={{ ...mono, color: C.rustDark }}>
              {num}
            </span>
            <h3 className="text-xl mb-2 ml-1.5" style={{ ...display, fontWeight: 600, color: C.ink }}>
              {title}
            </h3>
            <p className="text-base leading-relaxed ml-1.5" style={{ ...body, color: "rgba(58,42,32,0.8)" }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
