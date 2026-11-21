
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dragonflyImage from "../assets/images/dragonfly-account.png";
import "./AccountDragonfly.css";
import { createPortal } from "react-dom";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://ineveryunivers-books-api.onrender.com/api";

export default function AccountDragonfly() {
  const [signedIn, setSignedIn] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminArea =
    location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const isAccountArea =
    location.pathname === "/account" || location.pathname.startsWith("/account/");

  const verifySession = useCallback(async () => {
    const token = sessionStorage.getItem("userToken");

    if (!token) {
      setSignedIn(false);
      setHasUnread(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Neplatná relace");

      const data = await response.json();
      setSignedIn(Boolean(data.user));
      if (data.user) {
        const countResponse = await fetch(`${API_BASE}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setHasUnread(Number(countData.unread_count || 0) > 0);
        }
      } else {
        setHasUnread(false);
      }
    } catch {
      sessionStorage.removeItem("userToken");
      setSignedIn(false);
      setHasUnread(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession, location.pathname]);

  useEffect(() => {
    window.addEventListener("iu-auth-changed", verifySession);
    window.addEventListener("storage", verifySession);
    window.addEventListener("iu-notifications-changed", verifySession);
    const interval = window.setInterval(verifySession, 30000);

    return () => {
      window.removeEventListener("iu-auth-changed", verifySession);
      window.removeEventListener("storage", verifySession);
      window.removeEventListener("iu-notifications-changed", verifySession);
      window.clearInterval(interval);
    };
  }, [verifySession]);

  // Účetní vážka patří do veřejné části webu, ne do administrace ani osobního prostoru.
  if (isAdminArea || isAccountArea) return null;

  return createPortal(
  <button
    type="button"
    className={`iu-dragonfly-entry${signedIn ? " is-signed-in" : ""}${hasUnread ? " has-unread" : ""}`}
    onClick={() => navigate("/account")}
    aria-label={signedIn ? "Otevřít profil" : "Přihlásit se"}
    title={signedIn ? "Můj profil" : "Přihlášení"}
  >
    <span className="iu-dragonfly-ring">
      <img src={dragonflyImage} alt="" />
      {hasUnread && <span className="iu-dragonfly-notification-dot" aria-label="Nová upozornění" />}
    </span>
  </button>,
  document.body
);
}
