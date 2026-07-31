import { C } from "../theme";

export function StampCard({ children }) {
  return (
    <div 
      className="rounded-lg px-6 md:px-10 py-8 md:py-10" 
      style={{ 
        backgroundColor: C.paper, 
        boxShadow: "0 22px 50px -20px rgba(58,20,10,0.35)",
        border: `1px solid ${C.line}`
      }}
    >
      {children}
    </div>
  );
}
