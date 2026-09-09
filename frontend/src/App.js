import './App.css';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import articles from './articles.json';

function useDeals(limit) {
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ items: [], loading: true, error: null });
    fetch(`/api/deals?limit=${limit}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => setState({ items: Array.isArray(data.items) ? data.items : [], loading: false, error: null }))
      .catch(error => {
        if (error.name !== 'AbortError') {
          setState({ items: [], loading: false, error: 'Fynden kunde inte hämtas just nu. Försök igen senare.' });
        }
      });
    return () => controller.abort();
  }, [limit]);

  return state;
}


function Header() {
  return <header className="site-header"><div className="container nav-wrap"><Link className="brand" to="/"><span className="brand-mark">D</span><span>Dealsbot</span></Link><nav><Link to="/">Hem</Link><Link to="/guider">Guider</Link><Link to="/deals">Aktuella fynd</Link><Link to="/om-oss">Om oss</Link></nav></div></header>;
}

function AffiliateNote() {
  return <aside className="affiliate-note"><strong>Annonslänk:</strong> Vissa länkar på sidan är affiliatelänkar. Om du handlar via en sådan länk kan vi få provision, utan extra kostnad för dig. Vi väljer innehåll och råd oberoende av eventuell ersättning.</aside>;
}

function ArticleCard({ article }) {
  return <article className="article-card"><div className="card-kicker">{article.category} · {article.readTime}</div><h3><Link to={`/guider/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link className="text-link" to={`/guider/${article.slug}`}>Läs guiden <span aria-hidden="true">→</span></Link></article>;
}

function DealCard({ deal }) {
  return <article className="deal-card"><div className="deal-top"><span className="pill">Amazon.se</span><span className="deal-price">{deal.price}</span></div><h3>{deal.title}</h3><p>Kontrollera produktinformation, variant och leveransvillkor hos återförsäljaren före köp.</p>{deal.previous_price && <div className="old-price">Tidigare angivet pris: {deal.previous_price}</div>}<a className="button button-small" href={deal.url} target="_blank" rel="sponsored noopener noreferrer">Se hos Amazon <span aria-hidden="true">↗</span></a><small>Pris och lager kan ändras hos återförsäljaren.</small></article>;
}

function DealGrid({ limit }) {
  const { items, loading, error } = useDeals(limit);
  if (loading) return <div className="deal-status" role="status">Hämtar aktuella fynd…</div>;
  if (error) return <div className="deal-status deal-error" role="alert">{error}</div>;
  if (items.length === 0) return <div className="deal-status">Inga aktuella fynd hittades.</div>;
  return <div className="deal-grid">{items.map(deal => <DealCard key={deal.id} deal={deal} />)}</div>;
}

function Home() {
  return <><Header /><main><section className="hero"><div className="container hero-grid"><div><p className="eyebrow">Oberoende köpguider från Sverige</p><h1>Färre impulsköp.<br /><em>Bättre beslut.</em></h1><p className="hero-copy">Vi testar idéer, förklarar specifikationer och samlar praktiska råd så att du kan välja produkter som passar din vardag.</p><div className="hero-actions"><Link className="button" to="/guider">Utforska guider <span aria-hidden="true">→</span></Link><Link className="button button-ghost" to="/om-oss">Så arbetar vi</Link></div></div><div className="hero-card"><div className="hero-card-label">Veckans läsning</div><h2>Så jämför du produkter på nätet på ett smartare sätt</h2><p>En metod för att sålla bland specifikationer, omdömen och totalkostnad.</p><Link className="text-link" to="/guider/sa-jamfor-du-produkter-pa-natet">Läs guiden →</Link></div></div></section><section className="container section"><div className="section-heading"><div><p className="eyebrow">Utvalt för dig</p><h2>Guider som hjälper dig välja</h2></div><Link className="text-link" to="/guider">Alla guider →</Link></div><div className="article-grid">{articles.slice(0, 6).map(article => <ArticleCard key={article.slug} article={article} />)}</div></section><section className="section section-tint"><div className="container"><div className="section-heading"><div><p className="eyebrow">Prisbevakning</p><h2>Aktuella fynd</h2></div><Link className="text-link" to="/deals">Visa alla fynd →</Link></div><DealGrid limit={3} /><AffiliateNote /></div></section></main><Footer /></>;
}

function Guides() { return <><Header /><main className="container page"><p className="eyebrow">Kunskap före köp</p><h1>Guider</h1><p className="lead">Praktiska, lättlästa guider om teknik, hem, vardag och smartare köp. Varje guide är skriven för att hjälpa dig förstå vad som faktiskt spelar roll.</p><div className="article-grid article-grid-wide">{articles.map(article => <ArticleCard key={article.slug} article={article} />)}</div></main><Footer /></>; }

function GuideArticle() { const { slug } = useParams(); const article = articles.find(item => item.slug === slug); if (!article) return <NotFound />; return <><Header /><main className="container article-page"><Link className="back-link" to="/guider">← Till alla guider</Link><p className="eyebrow">{article.category} · {article.readTime}</p><h1>{article.title}</h1><p className="article-intro">{article.excerpt}</p><div className="article-meta">Senast uppdaterad {new Date(article.reviewedDate || article.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })} · Av {article.author || 'Dealsbot-redaktionen'}</div><div className="article-body">{article.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}<section><h2>Så använder vi guiden</h2><p>Guiden fokuserar på kriterier som går att kontrollera före köp. Produktpriser, lager, modeller och villkor kan ändras, så kontrollera alltid den aktuella informationen hos återförsäljaren och tillverkaren innan du beställer.</p></section></div><AffiliateNote /></main><Footer /></>; }

function Deals() { return <><Header /><main className="container page"><p className="eyebrow">Prisbevakning</p><h1>Aktuella fynd</h1><p className="lead">De 50 senast registrerade fynden från vår bevakning. Priser och lager kan ändras snabbt – öppna alltid återförsäljaren för aktuell information.</p><div className="prose"><h2>Så ska fynden läsas</h2><p>Listan är ett underlag för vidare kontroll, inte en garanti för lägsta pris eller att en viss produkt passar alla. Vi visar produktnamn och registrerat pris från vår bevakning och länkar sedan till återförsäljaren. Kontrollera alltid rätt variant, aktuellt pris, lager, leveransvillkor och returregler innan du beställer.</p><p>Vissa länkar är affiliatelänkar. Om du handlar via en sådan länk kan Dealsbot få provision utan extra kostnad för dig. Ersättningen ändrar inte priset hos återförsäljaren.</p></div><DealGrid limit={50} /><AffiliateNote /></main><Footer /></>; }

function About() { return <><Header /><main className="container narrow-page page"><p className="eyebrow">Om Dealsbot</p><h1>Råd som börjar i vardagen</h1><p className="lead">Dealsbot är en svensk köpguide för dig som vill förstå en produkt innan du beställer den.</p><div className="prose"><h2>Vårt uppdrag</h2><p>Vi vill göra produktjämförelser mer användbara. Därför fokuserar vi på användning i verkligheten: mått, underhåll, kompatibilitet, begränsningar och vilken typ av person produkten passar.</p><h2>Så arbetar vi</h2><p>Vi börjar med ett vardagsproblem och samlar sedan de specifikationer som löser det. Vi skiljer på fakta från tillverkaren, redaktionella bedömningar och sådant som behöver verifieras vid varje köp. Vi använder inte betalda omdömen och vi lovar inte att en viss produkt är rätt för alla.</p><h2>Transparens</h2><p>Vissa länkar är affiliatelänkar. Det innebär att vi kan få ersättning om du genomför ett köp efter att ha klickat på en länk. Det påverkar inte vad vi väljer att skriva om. Produktpriser, lagerstatus och villkor kan ändras hos återförsäljaren.</p><h2>Kontakt</h2><p>Har du hittat ett fel eller vill föreslå ett ämne? Kontakta redaktionen via den kanal som anges på webbplatsens officiella kontaktsida.</p></div></main><Footer /></>; }

function Contact() { return <><Header /><main className="container narrow-page page"><p className="eyebrow">Kontakt</p><h1>Hör av dig</h1><p className="lead">Har du hittat ett fel, vill föreslå ett ämne eller vill diskutera ett samarbete? Skicka ett meddelande till redaktionen.</p><div className="prose"><h2>Redaktionella rättelser</h2><p>Beskriv gärna vilken sida det gäller, vad som behöver rättas och vilken källa du hänvisar till. Vi prioriterar sakliga rättelser av priser, specifikationer och länkar.</p><h2>Kontaktadress</h2><p><a className="text-link" href="mailto:kontakt@deals.symeri.se">kontakt@deals.symeri.se</a></p></div></main><Footer /></>; }

function Privacy() { return <><Header /><main className="container narrow-page page"><p className="eyebrow">Integritet</p><h1>Integritetspolicy</h1><div className="prose"><h2>Vilka uppgifter samlas in?</h2><p>Dealsbot samlar inte in personuppgifter genom konto eller kommentarsfunktion på den här webbplatsen. Om du kontaktar redaktionen behandlas uppgifterna endast för att besvara ditt meddelande.</p><h2>Google AdSense och samtycke</h2><p>För att finansiera webbplatsen använder Dealsbot Google AdSense för att visa annonser. Google och Googles annonsteknikpartners kan behandla uppgifter som IP-adress, information om enhet och webbläsare samt uppgifter om hur webbplatsen och annonser används. Beroende på ditt samtycke kan cookies och lokal lagring användas för att leverera, mäta och anpassa annonser.</p><p>För besökare i Europeiska ekonomiska samarbetsområdet, Storbritannien och Schweiz visas ett samtyckesmeddelande via Googles certifierade samtyckeshanteringsplattform (CMP). Där kan du samtycka, avstå eller hantera dina val. Om du avstår kan annonser vara icke-personanpassade eller inte visas. Läs mer i <a className="text-link" href="https://policies.google.com/technologies/ads?hl=sv" target="_blank" rel="noopener noreferrer">Googles information om annonser och integritet</a>.</p><h2>Externa länkar</h2><p>När du följer en affiliatelänk lämnar du Dealsbot och omfattas av den externa webbplatsens villkor och integritetspolicy. Vi skickar inte in formulärdata till Amazon från Dealsbot.</p><h2>Cookies och loggar</h2><p>Driftleverantören kan behandla tekniska loggar för säkerhet och felsökning. Cookies och lokal lagring kan också behandlas av externa tjänster som används på webbplatsen, enligt deras villkor och integritetspolicy.</p><h2>Frågor</h2><p>Kontakta redaktionen på <a className="text-link" href="mailto:kontakt@deals.symeri.se">kontakt@deals.symeri.se</a> om du har frågor om integritet.</p></div></main><Footer /></>}

function Footer() { return <footer className="site-footer"><div className="container footer-grid"><div><Link className="brand footer-brand" to="/"><span className="brand-mark">D</span><span>Dealsbot</span></Link><p>Praktiska köpguider för en mer genomtänkt vardag.</p></div><div><h3>Utforska</h3><Link to="/guider">Guider</Link><Link to="/deals">Aktuella fynd</Link><Link to="/om-oss">Om oss</Link><Link to="/kontakt">Kontakt</Link></div><div><h3>Transparens</h3><p className="footer-note">Amazon och Amazon.se är varumärken som tillhör Amazon.com, Inc. eller dess dotterbolag. Dealsbot är inte en del av Amazon.</p><Link to="/om-oss">Redaktionell policy</Link><Link to="/integritet">Integritetspolicy</Link></div></div><div className="container copyright">© {new Date().getFullYear()} Dealsbot · Senast kontrollerad: september 2026</div></footer>; }

function NotFound() { return <><Header /><main className="container page not-found"><p className="eyebrow">404</p><h1>Sidan hittades inte</h1><p>Den här länken verkar inte finnas längre.</p><Link className="button" to="/">Till startsidan</Link></main><Footer /></>; }

export default function App() { return <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/guider" element={<Guides />} /><Route path="/guider/:slug" element={<GuideArticle />} /><Route path="/deals" element={<Deals />} /><Route path="/om-oss" element={<About />} /><Route path="/kontakt" element={<Contact />} /><Route path="/integritet" element={<Privacy />} /><Route path="*" element={<NotFound />} /></Routes></BrowserRouter>; }
