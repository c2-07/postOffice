import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { C } from "./theme";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { UploadPage } from "./pages/UploadPage";
import { AuthPage } from "./pages/AuthPage";
import { DownloadPage } from "./pages/DownloadPage";
import { ProfilePage } from "./pages/ProfilePage";

function FontImport() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Lora:ital,wght@0,400;0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500;700&display=swap');
    `}</style>
  );
}

export default function App() {
  const [user, setUserState] = useState(() => {
    const saved = localStorage.getItem("postoffice_user");
    return saved ? JSON.parse(saved) : null;
  });

  const isLoggedIn = !!user;

  const handleLogin = (userData) => {
    localStorage.setItem("postoffice_user", JSON.stringify(userData));
    setUserState(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("postoffice_user");
    setUserState(null);
  };

  return (
    <BrowserRouter>
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: C.bg }}
      >
        <FontImport />
        <Nav isLoggedIn={isLoggedIn} logout={handleLogout} user={user} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/p/:id" element={<DownloadPage />} />
            <Route
              path="/profile"
              element={<ProfilePage isLoggedIn={isLoggedIn} user={user} />}
            />
            <Route
              path="/upload"
              element={<UploadPage isLoggedIn={isLoggedIn} user={user} />}
            />
            <Route
              path="/login"
              element={
                isLoggedIn ? (
                  <Navigate to="/upload" />
                ) : (
                  <AuthPage mode="login" onSuccess={handleLogin} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                isLoggedIn ? (
                  <Navigate to="/upload" />
                ) : (
                  <AuthPage mode="signup" onSuccess={handleLogin} />
                )
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
