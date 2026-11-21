import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProjectsPage from "./ProjectsPage";
import MusicAdminPage from "./MusicAdminPage";
import VideoLibraryAdminPage from "./VideoLibraryAdminPage";
import CoversAdminPage from "./CoversAdminPage";
import UsersAdminPage from "./UsersAdminPage";
import BetaCenterPage from "./BetaCenterPage";
import SiteSettingsAdminPage from "./SiteSettingsAdminPage";
import ModeratorPage from "./ModeratorPage";
import Stars from "../components/Stars";
import "./AdminPage.css";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000/api" : "https://ineveryunivers-books-api.onrender.com/api";
const CARD_DEFS = [
 {id:"books",title:"Knihy a kapitoly",desc:"Projekty, knihy, kapitoly a jejich obsah.",icon:"▤",group:"content"},
 {id:"covers",title:"Obálky",desc:"Obálky knih a svazků.",icon:"▧",group:"content"},
 {id:"music",title:"Hudba",desc:"Soundtracky a hudební knihovna.",icon:"♫",group:"content"},
 {id:"videos",title:"Filmotéka",desc:"Videa, náhledy a přiřazení ke knihám.",icon:"▷",group:"content"},
 {id:"users",title:"Uživatelé a účty",desc:"Profily, role, stav účtů a odznaky.",icon:"♙",group:"people"},
 {id:"community",title:"Komunita a moderace",desc:"Příspěvky, komentáře a nahlášený obsah.",icon:"✧",group:"people"},
 {id:"beta",title:"Beta centrum",desc:"Testovací funkce a zpětná vazba.",icon:"⚗",group:"tools"},
 {id:"settings",title:"Nastavení webu",desc:"Globální nastavení a přístupová pravidla.",icon:"⚙",group:"tools"},
 {id:"audit",title:"Protokol činností",desc:"Přehled důležitých změn v administraci.",icon:"≡",group:"tools"},
];
export default function AdminPage(){
 const [user,setUser]=useState(null),[checking,setChecking]=useState(true),[error,setError]=useState(""),[active,setActive]=useState("home");
 const navigate=useNavigate();
 useEffect(()=>{let live=true;const token=sessionStorage.getItem("userToken");if(!token){setChecking(false);return()=>{live=false;};}fetch(`${API_BASE}/auth/me`,{headers:{Authorization:`Bearer ${token}`}}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Přihlášení vypršelo.");return d;}).then(d=>{if(live)setUser(d.user);}).catch(e=>{sessionStorage.removeItem("userToken");if(live)setError(e.message);}).finally(()=>{if(live)setChecking(false);});return()=>{live=false;};},[]);
 const roles=user?.roles||[];const owner=roles.includes("owner"),admin=roles.includes("admin"),moderator=roles.includes("moderator"),beta=roles.includes("beta_tester");
 const allowed=useMemo(()=>owner?CARD_DEFS:admin?CARD_DEFS.filter(c=>["books","covers","music","videos","users","community","beta"].includes(c.id)):[],[owner,admin]);
 useEffect(()=>{if(!checking&&user&&!owner&&!admin){if(moderator)navigate("/moderation",{replace:true});else if(beta)navigate("/admin/beta",{replace:true});else navigate("/account",{replace:true});}},[checking,user,owner,admin,moderator,beta,navigate]);
 async function logout(){const token=sessionStorage.getItem("userToken");try{if(token)await fetch(`${API_BASE}/auth/logout`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});}finally{sessionStorage.removeItem("userToken");navigate("/account");}}
 if(checking)return <main className="iu-admin"><div className="iu-admin-loading">Ověřuji přístup…</div></main>;
 if(!user)return <main className="iu-admin iu-admin-gate"><div className="iu-admin-gate-card"><span className="iu-mark">✧</span><h1>Vstup do administrace</h1><p>{error||"Přihlas se svým běžným účtem."}</p><Link to="/account" className="iu-gold-button">Přejít k přihlášení</Link></div></main>;
 if(!owner&&!admin)return <main className="iu-admin"><div className="iu-admin-loading">Přesměrovávám do tvého centra…</div></main>;
 const selected=allowed.find(c=>c.id===active);
 return <main className="iu-admin"><Stars/><div className="iu-admin-cloud-glow"/><header className="iu-admin-header"><Link to="/" className="iu-admin-brand"><span className="iu-brand-mark">✧</span><span>ineveryunivers.books<small>CENTRUM SPRÁVY</small></span></Link><div className="iu-admin-user"><span>{user.display_name||user.username}</span><span className="iu-role-pill">{owner?"Vlastník":"Administrátor"}</span><Link to="/account">Můj účet</Link><button onClick={logout}>Odhlásit</button></div></header>
 <section className="iu-admin-intro"><p className="iu-kicker">NOČNÍ KNIHOVNA · SPRÁVA SVĚTA</p><h1>{owner?"Vítej ve svém řídicím centru":"Administrace webu"}</h1><p>{owner?"Všechny části projektu na jednom místě. Vyber, co chceš právě spravovat.":"Vyber oblast, kterou máš oprávnění spravovat."}</p></section>
 {active==="home"?<section className="iu-admin-card-grid">{allowed.map((card,i)=><button key={card.id} className="iu-admin-card" style={{"--card-delay":`${i*45}ms`}} onClick={()=>setActive(card.id)}><span className="iu-admin-card-icon">{card.icon}</span><span className="iu-admin-card-title">{card.title}</span><span className="iu-admin-card-desc">{card.desc}</span><span className="iu-admin-card-arrow">Otevřít <b>↗</b></span></button>)}</section>:<section className="iu-admin-workspace"><div className="iu-admin-workspace-head"><button onClick={()=>setActive("home")} className="iu-back-link">← Všechna centra</button><h2>{selected?.title}</h2></div>{active==="books"&&<ProjectsPage/>}{active==="covers"&&<CoversAdminPage/>}{active==="music"&&<MusicAdminPage/>}{active==="videos"&&<VideoLibraryAdminPage/>}{active==="users"&&<UsersAdminPage embedded/>}{active==="community"&&<ModeratorPage embedded/>}{active==="beta"&&<BetaCenterPage embedded/>}{active==="settings"&&<SiteSettingsAdminPage/>}{active==="audit"&&<div className="iu-coming-soon"><span>≡</span><h3>{selected?.title}</h3><p>Protokol činností doplníme v další etapě.</p></div>}</section>}
 <footer className="iu-admin-footer"><span>✧</span> IN EVERY UNIVERSE <span>·</span> SPRÁVA S RESPEKTEM K PŘÍBĚHŮM</footer></main>;
}
