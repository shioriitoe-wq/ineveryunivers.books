import "./CommunityPage.css";
import { Link } from "react-router-dom";

const news = [
  { category: "KAPITOLA", title: "Nová kapitola už brzy", text: "Podívejte se, co nového se chystá v našich příbězích.", action: "ZJISTIT VÍCE", tone: "rose", image: "sunset" },
  { category: "ZE ZÁKULISÍ", title: "Nahlédněte do našeho světa", text: "Novinky, fotografie a malé střípky z tvorby.", action: "PROHLÉDNOUT", tone: "sage", image: "books" },
  { category: "AKTUALITA", title: "Pomozte nám s novým webem", text: "Vaše názory a nápady nám pomohou posunout komunitu dál.", action: "VYJÁDŘIT SE", tone: "gold", image: "flowers" },
];

const panels = [
  { icon: "comments", title: "Komentáře", description: "Podělte se o své názory, teorie a oblíbené momenty.", tone: "rose", number: "01" },
  { icon: "fans", title: "Fanoušci", description: "Poznejte komunitu lidí, kteří milují naše příběhy stejně jako vy.", tone: "gold", number: "02" },
  { icon: "updates", title: "Co se děje", description: "Novinky, zákulisí, fotografie, videa a všechno, co sdílíme.", tone: "sage", number: "03" },
  { icon: "calendar", title: "Kalendář", description: "Sledujte, co chystáme a kdy vychází nové kapitoly.", tone: "blue", number: "04" },
  { icon: "survey", title: "Dotazníky", description: "Řekněte nám, co si myslíte. Vaše zpětná vazba je důležitá.", tone: "lilac", number: "05" },
  { icon: "universe", title: "Universe", description: "Nové možnosti a zážitky ze světa InEveryUniverse.", tone: "peach", number: "06", inactive: true },
];

function CommunityPanelIcon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    comments: <><path d="M4 5.5h16v11H9l-5 4v-15Z"/><path d="M8 9h8M8 13h5"/></>,
    fans: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-3.4 2.4-5 5.5-5s5 1.6 5.5 5"/><path d="M16 5.5a3 3 0 0 1 0 5.8M17 15c2.2.4 3.4 2 3.7 4"/></>,
    updates: <><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m5 17 4-4 3 3 3-4 4 5"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16M8 13h2M14 13h2M8 16.5h2"/></>,
    survey: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M8.5 10h7M8.5 14h7M8.5 18h4"/><path d="m7.5 9.8.8.8 1.5-1.7"/></>,
    universe: <><path d="M12 2.5 14 9l6.5 3-6.5 2-2 7-2-7L3.5 12 10 9l2-6.5Z"/><path d="M19 2v4M17 4h4M4 17v4M2 19h4"/></>
  };
  return <svg className="community-v2-icon-svg" viewBox="0 0 24 24" aria-hidden="true" {...common}>{paths[name] || paths.universe}</svg>;
}

function CommunityPage() {
  return (
    <main className="community-page-v2">
      <div className="community-v2-texture" aria-hidden="true" />
      <header className="community-v2-topbar">
        <Link to="/" className="community-v2-back"><span>‹</span> ZPĚT NA ÚVODNÍ STRÁNKU</Link>

      </header>

      <div className="community-v2-page-title">
        <div className="community-v2-title">KOMUNITA</div>
      </div>

      <div className="community-v2-layout">
        <div className="community-v2-sidebar">
          <Link to="/account" className="community-v2-join-banner">
            <span className="community-v2-join-mark" aria-hidden="true">✧</span>
            <span className="community-v2-join-copy"><strong>Přidej se</strong><small>Staň se součástí našeho světa</small></span>
            <span className="community-v2-join-arrow" aria-hidden="true">→</span>
          </Link>
          <aside className="community-v2-news">
          <div className="community-v2-news-heading">NOVINKY</div>
          <div className="community-v2-news-window">
            <div className="community-v2-news-track">
              {[...news, ...news].map((item, index) => (
                <article className={`community-v2-news-item ${item.tone}`} key={`${item.title}-${index}`}>
                  <div className={`community-v2-news-image image-${item.image}`} aria-hidden="true">
                    <span>{item.image === "sunset" ? "☼" : item.image === "books" ? "✧" : "❀"}</span>
                  </div>
                  <div className="community-v2-news-copy">
                    <span className="community-v2-tag">{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <span className="community-v2-news-action">{item.action} →</span>
                  </div>
                  <span className="community-v2-news-dot" />
                </article>
              ))}
            </div>
          </div>
          <button type="button" className="community-v2-all-news">ZOBRAZIT VŠECHNY NOVINKY <span>⌄</span></button>
          </aside>
        </div>

        <section className="community-v2-main">
          <div className="community-v2-hero">
            <div className="community-v2-quote-line">
              <p className="community-v2-quote">Citát dne: „A ty se moc nesměj, plechová hubo!“</p>
              <span className="community-v2-quote-author">— ALEX</span>
            </div>
          </div>

          <div className="community-v2-panels">
            {panels.map((panel) => {
              const content = <>
                <div className="community-v2-panel-icon"><CommunityPanelIcon name={panel.icon} /></div>
                <h2>{panel.title}</h2>
                <p>{panel.description}</p>
                {panel.inactive ? <span className="community-v2-panel-status">PŘIPRAVUJEME</span> : <span className="community-v2-panel-arrow">→</span>}
              </>;
              return <article className={`community-v2-panel ${panel.tone} ${panel.inactive ? "is-inactive" : ""}`} key={panel.title}>{content}</article>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

export default CommunityPage;
