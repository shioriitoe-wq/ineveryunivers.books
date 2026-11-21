import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./RolePages.css";
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000/api" : "https://ineveryunivers-books-api.onrender.com/api";
export default function BetaCenterPage() {
  const [state, setState] = useState("loading");
  useEffect(() => { let live = true; const token = sessionStorage.getItem("userToken"); if (!token) { setState("denied"); return () => { live = false; }; } fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : Promise.reject()).then(d => { if (live) setState((d.user?.roles || []).some(role => ["owner", "admin", "beta_tester"].includes(role)) ? "allowed" : "denied"); }).catch(() => { if (live) setState("denied"); }); return () => { live = false; }; }, []);
  if (state === "loading") return <main className="role-page"><p>Ověřuji přístup…</p></main>;
  if (state === "denied") return <main className="role-page"><h1>Beta centrum</h1><p>Tato část je dostupná pouze beta testerům, administrátorům a vlastníkovi webu.</p><Link to="/account">Přejít k účtu</Link></main>;
  return <main className="role-page"><Link to="/">← Zpět na web</Link><h1>Beta centrum</h1><p>Prostor pro testované funkce, instrukce, známé chyby a zpětnou vazbu.</p><p>Obsah Beta centra připravíme v další fázi. Zatím zde nejsou dostupné žádné testovací úkoly.</p></main>;
}
