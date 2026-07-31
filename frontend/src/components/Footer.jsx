import { mono } from "../theme";

export function Footer() {
  return (
    <footer className="text-center text-sm py-16" style={{ ...mono, color: "rgba(58,42,32,0.6)" }}>
      postOffice — built by <a href="https://github.com/c2-07" className="hover:underline" style={{ color: "rgba(58,42,32,0.8)" }}>c2-07</a>
    </footer>
  );
}
