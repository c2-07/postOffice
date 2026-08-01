import { Link } from "react-router-dom";
import { C, display, mono } from "../theme";

export function Nav({ isLoggedIn, logout, user }) {
  // Extract user email, handling both old {email} format and new {user: {email}, access_token} format
  const userEmail = user?.user?.email || user?.email || "";

  return (
    <nav className="flex items-center justify-between max-w-5xl mx-auto px-6 py-8 w-full">
      <Link to="/" className="text-2xl font-bold tracking-tight" style={display}>
        <span style={{ color: C.rustDark }}>post</span>
        <span style={{ color: C.ink }}>Office</span>
      </Link>
      <div className="flex items-center gap-8 text-sm" style={mono}>
        <Link to="/upload" className="hover:underline" style={{ color: C.ink }}>Upload</Link>
        {isLoggedIn ? (
          <div className="flex items-center gap-6">
            <span style={{ color: "rgba(58,42,32,0.6)" }}>{userEmail}</span>
            <button onClick={logout} className="hover:underline" style={{ color: C.ink }}>
              Log out
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="hover:underline" style={{ color: C.ink }}>Log in</Link>
            <Link to="/signup" className="px-5 py-2.5 rounded hover:opacity-90 transition-opacity" style={{ backgroundColor: C.ink, color: C.paper }}>
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

