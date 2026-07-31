import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  FileUp,
  Database,
  Globe,
  Package,
  Link2,
  Send,
  ShieldCheck,
  Clock,
  Code,
} from "lucide-react";
import { C, display, body, mono } from "../theme";
import { StampCard } from "../components/StampCard";
import { StampSquare } from "../components/StampSquare";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-24 md:pb-32 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 md:gap-8 items-center">
        <div className="max-w-xl">
          <h1
            className="text-5xl md:text-7xl leading-tight mb-8 tracking-tight"
            style={{ ...display, fontWeight: 600, color: C.ink }}
          >
            Send a file
            <br />
            like it's <em style={{ color: C.rust }}>mail</em>.
          </h1>
          <p
            className="text-xl md:text-2xl mb-10 leading-relaxed"
            style={{ ...body, color: "rgba(58,42,32,0.85)" }}
          >
            Upload a file, get a link, hand it off. No clutter — just a parcel
            and an address.
          </p>
          <button
            onClick={() => navigate("/upload")}
            className="inline-flex items-center gap-3 px-8 py-4 rounded hover:opacity-90 transition-opacity"
            style={{
              ...mono,
              backgroundColor: C.ink,
              color: C.paper,
              fontSize: "15px",
              boxShadow: "0 10px 20px -10px rgba(58,20,10,0.3)",
            }}
          >
            Drop a file <ArrowRight size={18} />
          </button>
        </div>

        {/* The StampSquare pushed down to act as a bridge into the next section */}
        <div className="hidden md:flex justify-end relative z-30 drop-shadow-2xl">
          <StampSquare rotate={8} size="w-56 h-64" />
        </div>
      </header>

      {/* How it travels */}
      <section className="relative z-20 max-w-5xl mx-auto px-6 pb-16">
        <StampCard>
          <h2
            className="text-2xl md:text-3xl mb-12 pb-6"
            style={{
              ...display,
              fontWeight: 600,
              color: C.ink,
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            How it works
          </h2>

          <div className="relative">
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
              style={{ zIndex: 1 }}
            >
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
                <div
                  key={num}
                  className="text-center md:text-left"
                  style={{ backgroundColor: C.paper }}
                >
                  <div
                    className="hover:scale-110 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0"
                    style={{
                      backgroundColor: C.rust,
                      boxShadow: "0 10px 20px -10px rgba(58,20,10,0.45)",
                    }}
                  >
                    <Icon size={24} color={C.paper} />
                  </div>
                  <span
                    className="block text-sm mb-2 ml-1.5 tracking-widest"
                    style={{ ...mono, color: C.rustDark }}
                  >
                    {num}
                  </span>
                  <h3
                    className="text-xl mb-2 ml-1.5"
                    style={{ ...display, fontWeight: 600, color: C.ink }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-base leading-relaxed ml-1.5"
                    style={{ ...body, color: "rgba(58,42,32,0.8)" }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </StampCard>
      </section>

      {/* Creed */}
      <section className="relative z-20 max-w-5xl mx-auto px-6 pb-24 pt-8">
        <StampCard>
          <h2
            className="text-2xl md:text-3xl mb-8 pb-6"
            style={{
              ...display,
              fontWeight: 600,
              color: C.ink,
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            The postOffice creed
          </h2>
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
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
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
        </StampCard>
      </section>
    </div>
  );
}
