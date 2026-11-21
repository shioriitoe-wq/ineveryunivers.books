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
  const [hasActivity, setHasActivity] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshActivity = useCallback(async () => {
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      setSignedIn(false);
      setHasActivity(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Neplatná relace");
      const data = await response.json();
      setSignedIn(Boolean(data.user));

      // Until the unified notification center is installed, unread PMs
      // are the first activity type represented by the golden indicator.
      const inboxResponse = await fetch(`${API_BASE}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (inboxResponse.ok) {
        const inbox = await inboxResponse.json();
        const unread = (inbox.conversations || []).reduce(
          (sum, conversation) => sum + Number(conversation.unread_count || 0), 0
        );
        setHasActivity(unread > 0);
      }
    } catch {
      sessionStorage.removeItem("userToken");
      setSignedIn(false);
      setHasActivity(false);
    }
  }, []);

  useEffect(() => {
    refreshActivity();
  }, [refreshActivity, location.pathname]);

  useEffect(() => {
    window.addEventListener("iu-auth-changed", refreshActivity);
    window.addEventListener("storage", refreshActivity);
    const interval = window.setInterval(refreshActivity, 30000);
    return () => {
      window.removeEventListener("iu-auth-changed", refreshActivity);
      window.removeEventListener("storage", refreshActivity);
      window.clearInterval(interval);
    };
  }, [refreshActivity]);

  return createPortal(
    <button
      type="button"
      className={`iu-dragonfly-entry${signedIn ? " is-signed-in" : ""}${hasActivity ? " has-activity" : ""}`}
      onClick={() => navigate("/account")}
      aria-label={signedIn ? (hasActivity ? "Otevřít profil – nové upozornění" : "Otevřít profil") : "Přihlásit se"}
      title={signedIn ? (hasActivity ? "Můj profil – nová aktivita" : "Můj profil") : "Přihlášení"}
    >
      <span className="iu-dragonfly-ring">
        <img src={dragonflyImage} alt="" />
        {hasActivity && <span className="iu-dragonfly-activity-dot" aria-label="Nová aktivita" />}
      </span>
    </button>,
    document.body
  );
}
