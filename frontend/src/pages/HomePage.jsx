import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { C, display, body, mono } from "../theme";
import { StampCard } from "../components/StampCard";
import { StampSquare } from "../components/StampSquare";

// Extracted Components
import { HowItWorks } from "../components/HowItWorks";
import { Creed } from "../components/Creed";

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
          <HowItWorks />
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
          <Creed />
        </StampCard>
      </section>
    </div>
  );
}
