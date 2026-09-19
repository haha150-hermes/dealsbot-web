#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '..', 'build');
const articles = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'articles.json'), 'utf8'));
const baseUrl = 'https://symeri.se';
const cssFile = fs.readdirSync(path.join(buildDir, 'static', 'css')).find(name => /^main\..+\.css$/.test(name));
const jsFile = fs.readdirSync(path.join(buildDir, 'static', 'js')).find(name => /^main\..+\.js$/.test(name));

if (!cssFile || !jsFile) {
  throw new Error('React build assets were not found');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function siteHeader() {
  return `<header class="site-header"><div class="container nav-wrap"><a class="brand" href="/"><span class="brand-mark">D</span><span>Dealsbot</span></a><nav><a href="/">Hem</a><a href="/guider/">Guider</a><a href="/verktyg/">Verktyg</a><a href="/deals">Aktuella fynd</a><a href="/om-oss">Om oss</a></nav></div></header>`;
}

function affiliateNote() {
  return '<aside class="affiliate-note"><strong>Annonslänk:</strong> Vissa länkar på sidan är affiliatelänkar. Om du handlar via en sådan länk kan vi få provision, utan extra kostnad för dig. Vi väljer innehåll och råd oberoende av eventuell ersättning.</aside>';
}

function footer() {
  return `<footer class="site-footer"><div class="container footer-grid"><div><a class="brand footer-brand" href="/"><span class="brand-mark">D</span><span>Dealsbot</span></a><p>Praktiska köpguider och verktyg för en mer genomtänkt vardag.</p></div><div><h3>Utforska</h3><a href="/guider/">Guider</a><a href="/verktyg/">Verktyg</a><a href="/deals">Aktuella fynd</a><a href="/om-oss">Om oss</a><a href="/kontakt">Kontakt</a></div><div><h3>Transparens</h3><p class="footer-note">Verktygen har inga affiliatelänkar. Amazon och Amazon.se är varumärken som tillhör Amazon.com, Inc. eller dess dotterbolag.</p><a href="/om-oss">Redaktionell policy</a><a href="/integritet">Integritetspolicy</a></div></div><div class="container copyright">© ${new Date().getFullYear()} Dealsbot · Senast kontrollerad: september 2026</div></footer>`;
}

function appScript() {
  return `<script defer src="/static/js/${jsFile}"></script>`;
}

function pageDocument({ title, description, canonical, body, structuredData }) {
  const schema = structuredData
    ? `<script type="application/ld+json">${jsonForHtml(structuredData)}</script>`
    : '';
  return `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f5b49"><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="Dealsbot-redaktionen"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="article"><link rel="stylesheet" href="/static/css/${cssFile}"><link rel="icon" href="/favicon.ico"><link rel="manifest" href="/manifest.json"><title>${escapeHtml(title)}</title><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1526341836163709" crossorigin="anonymous"></script>${schema}</head><body><div id="root">${body}</div>${appScript()}</body></html>`;
}

function articleCard(article) {
  return `<article class="article-card"><div class="card-kicker">${escapeHtml(article.category)} · ${escapeHtml(article.readTime)}</div><h2><a href="/guider/${escapeHtml(article.slug)}/">${escapeHtml(article.title)}</a></h2><p>${escapeHtml(article.excerpt)}</p><a class="text-link" href="/guider/${escapeHtml(article.slug)}/">Läs guiden <span aria-hidden="true">→</span></a></article>`;
}

function articleBody(article) {
  return article.sections.map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`).join('');
}

function articleEvidence(article) {
  const takeaways = article.keyTakeaways.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const checklist = article.checklist.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  return `<section class="article-evidence"><h2>Snabb sammanfattning</h2><ul>${takeaways}</ul><p class="editorial-method">${escapeHtml(article.editorialMethod)}</p></section><section class="article-evidence"><h2>Kontroll före köp</h2><ul>${checklist}</ul></section><div class="review-note"><strong>Senaste granskning:</strong> ${escapeHtml(article.reviewNote)}</div>`;
}

function sourceList(article) {
  const sources = article.sources.map(source => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} <span aria-hidden="true">↗</span></a></li>`).join('');
  return `<section class="article-sources"><h2>Källor och vidare läsning</h2><ul>${sources}</ul><p>Priser, lager och produktvarianter är föränderliga uppgifter. Kontrollera alltid den aktuella informationen hos tillverkaren eller återförsäljaren.</p></section>`;
}

function articleSchema(article, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    dateModified: article.reviewedDate || article.date,
    author: { '@type': 'Organization', name: article.author || 'Dealsbot-redaktionen', url: `${baseUrl}/om-oss` },
    publisher: { '@type': 'Organization', name: 'Dealsbot', url: baseUrl },
    mainEntityOfPage: canonical,
    inLanguage: 'sv-SE',
    isAccessibleForFree: true,
    citation: article.sources.map(source => source.url),
  };
}

function guideIndexPage() {
  const body = `${siteHeader()}<main class="container page"><p class="eyebrow">Kunskap före köp</p><h1>Guider</h1><p class="lead">Praktiska, lättlästa guider om teknik, hem, vardag och smartare köp. Varje guide förklarar vad som spelar roll, vilka kompromisser som finns och vad du bör kontrollera före köp.</p><div class="article-grid article-grid-wide">${articles.map(articleCard).join('')}</div></main>${footer()}`;
  return pageDocument({
    title: 'Köpguider om teknik, hem och vardag | Dealsbot',
    description: 'Originala köpguider om teknik, hem, vardag och smartare produktval från Dealsbot.',
    canonical: `${baseUrl}/guider/`,
    body,
    structuredData: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Dealsbot köpguider', url: `${baseUrl}/guider/`, description: 'Originala svenska köpguider.' },
  });
}

function guideArticlePage(article) {
  const canonical = `${baseUrl}/guider/${article.slug}/`;
  const body = `${siteHeader()}<main class="container article-page"><a class="back-link" href="/guider/">← Till alla guider</a><p class="eyebrow">${escapeHtml(article.category)} · ${escapeHtml(article.readTime)}</p><h1>${escapeHtml(article.title)}</h1><p class="article-intro">${escapeHtml(article.excerpt)}</p><div class="article-meta">Senast uppdaterad ${escapeHtml(new Date(article.reviewedDate || article.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }))} · Av ${escapeHtml(article.author || 'Dealsbot-redaktionen')}</div>${articleEvidence(article)}<div class="article-body">${articleBody(article)}<section><h2>Så använder vi guiden</h2><p>Guiden fokuserar på kriterier som går att kontrollera före köp. Produktpriser, lager, modeller och villkor kan ändras, så kontrollera alltid den aktuella informationen hos återförsäljaren och tillverkaren innan du beställer.</p></section></div>${sourceList(article)}${affiliateNote()}</main>${footer()}`;
  return pageDocument({
    title: `${article.title} | Dealsbot`,
    description: article.excerpt,
    canonical,
    body,
    structuredData: articleSchema(article, canonical),
  });
}

function homePage() {
  const body = `${siteHeader()}<main><section class="hero"><div class="container hero-grid"><div><p class="eyebrow">Källbaserade köpguider från Sverige</p><h1>Färre impulsköp.<br><em>Bättre beslut.</em></h1><p class="hero-copy">Vi granskar offentliga källor, förklarar specifikationer och samlar praktiska råd så att du kan välja produkter som passar din vardag.</p><div class="hero-actions"><a class="button" href="/guider/">Utforska guider <span aria-hidden="true">→</span></a><a class="button button-ghost" href="/verktyg/">Använd verktyg</a></div></div><div class="hero-card"><div class="hero-card-label">Veckans läsning</div><h2>${escapeHtml(articles[articles.length - 1].title)}</h2><p>${escapeHtml(articles[articles.length - 1].excerpt)}</p><a class="text-link" href="/guider/${escapeHtml(articles[articles.length - 1].slug)}/">Läs guiden →</a></div></div></section><section class="container section"><div class="section-heading"><div><p class="eyebrow">Utvalt för dig</p><h2>Guider som hjälper dig välja</h2></div><a class="text-link" href="/guider/">Alla guider →</a></div><div class="article-grid">${articles.slice(0, 6).map(articleCard).join('')}</div></section><section class="section section-tint"><div class="container"><div class="section-heading"><div><p class="eyebrow">Praktiskt beslutsstöd</p><h2>Räkna innan du köper</h2></div><a class="text-link" href="/verktyg/">Öppna verktygen →</a></div><p class="lead">Använd våra lokala kalkyler för kapacitet, totalkostnad och personliga jämförelser. De har inga affiliatelänkar.</p></div></section><section class="section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Prisbevakning</p><h2>Aktuella fynd</h2></div><a class="text-link" href="/deals">Visa alla fynd →</a></div><p class="lead">Våra aktuella fynd hämtas från en separat prisbevakning. Priser, lager och återförsäljarvillkor kan ändras snabbt och ska alltid kontrolleras före köp.</p>${affiliateNote()}</div></section></main>${footer()}`;
  return pageDocument({
    title: 'Dealsbot – svenska köpguider och fynd',
    description: 'Praktiska svenska köpguider och handplockade fynd för mer genomtänkta produktval.',
    canonical: `${baseUrl}/`,
    body,
    structuredData: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Dealsbot', url: `${baseUrl}/`, description: 'Svenska köpguider och fynd.' },
  });
}

function aboutPage() {
  const body = `${siteHeader()}<main class="container narrow-page page"><p class="eyebrow">Om Dealsbot</p><h1>Råd som börjar i vardagen</h1><p class="lead">Dealsbot är en svensk researchbaserad köpguide för dig som vill förstå en produkt innan du beställer den.</p><div class="prose"><h2>Vårt uppdrag</h2><p>Vi vill göra produktjämförelser mer användbara. Därför fokuserar vi på användning i verkligheten: mått, underhåll, kompatibilitet, begränsningar och vilken typ av person produkten passar.</p><h2>Så arbetar vi</h2><p>Vi börjar med ett vardagsproblem och samlar offentliga källor, tillverkaruppgifter och praktiska kontrollpunkter. Vi skiljer på verifierbara specifikationer, redaktionella bedömningar och sådant som behöver kontrolleras vid varje köp. Om vi inte själva har testat en produkt säger vi inte att vi har gjort det.</p><h2>Underhåll och rättelser</h2><p>Varje guide har en senaste granskningsdag, en ändringsnotis och länkar till de källor som låg till grund för texten. När en källa, specifikation eller länk förändras ska sidan uppdateras eller tydligt markeras som osäker. Rättelser prioriteras framför att behålla en gammal rekommendation.</p><h2>Verktyg utan affiliatelänkar</h2><p>Våra kalkyler och jämförelsemallar fungerar lokalt i webbläsaren och är inte kopplade till en produktlänk. De visar uppskattningar och personliga avvägningar, inte objektiva testbetyg.</p><h2>Transparens</h2><p>Vissa länkar är affiliatelänkar. Det innebär att vi kan få ersättning om du genomför ett köp efter att ha klickat på en länk. Det påverkar inte vad vi väljer att skriva om. Produktpriser, lagerstatus och villkor kan ändras hos återförsäljaren.</p><h2>Kontakt</h2><p>Har du hittat ett fel eller vill föreslå ett ämne? Kontakta redaktionen via <a class="text-link" href="/kontakt">kontaktsidan</a>.</p></div></main>${footer()}`;
  return pageDocument({ title: 'Om Dealsbot – redaktion och metod', description: 'Läs om Dealsbots redaktionella metod, transparens och hur köpguiderna tas fram.', canonical: `${baseUrl}/om-oss`, body, structuredData: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Om Dealsbot', url: `${baseUrl}/om-oss` } });
}

function contactPage() {
  const body = `${siteHeader()}<main class="container narrow-page page"><p class="eyebrow">Kontakt</p><h1>Hör av dig</h1><p class="lead">Har du hittat ett fel, vill föreslå ett ämne eller vill diskutera ett samarbete? Skicka ett meddelande till redaktionen.</p><div class="prose"><h2>Redaktionella rättelser</h2><p>Beskriv gärna vilken sida det gäller, vad som behöver rättas och vilken källa du hänvisar till. Vi prioriterar sakliga rättelser av priser, specifikationer och länkar.</p><h2>Kontaktadress</h2><p><a class="text-link" href="mailto:kontakt@deals.symeri.se">kontakt@deals.symeri.se</a></p></div></main>${footer()}`;
  return pageDocument({ title: 'Kontakt | Dealsbot', description: 'Kontakta Dealsbots redaktion om rättelser, ämnesförslag eller samarbeten.', canonical: `${baseUrl}/kontakt`, body });
}

function privacyPage() {
  const body = `${siteHeader()}<main class="container narrow-page page"><p class="eyebrow">Integritet</p><h1>Integritetspolicy</h1><div class="prose"><h2>Vilka uppgifter samlas in?</h2><p>Dealsbot samlar inte in personuppgifter genom konto eller kommentarsfunktion på den här webbplatsen. Om du kontaktar redaktionen behandlas uppgifterna endast för att besvara ditt meddelande.</p><h2>Google AdSense och samtycke</h2><p>För att finansiera webbplatsen använder Dealsbot Google AdSense för att visa annonser. Google och Googles annonsteknikpartners kan behandla uppgifter som IP-adress, information om enhet och webbläsare samt uppgifter om hur webbplatsen och annonser används. Beroende på ditt samtycke kan cookies och lokal lagring användas för att leverera, mäta och anpassa annonser.</p><p>För besökare i Europeiska ekonomiska samarbetsområdet, Storbritannien och Schweiz visas ett samtyckesmeddelande via Googles certifierade samtyckeshanteringsplattform (CMP). Där kan du samtycka, avstå eller hantera dina val. Om du avstår kan annonser vara icke-personanpassade eller inte visas. Läs mer i <a class="text-link" href="https://policies.google.com/technologies/ads?hl=sv" target="_blank" rel="noopener noreferrer">Googles information om annonser och integritet</a>.</p><h2>Externa länkar</h2><p>När du följer en affiliatelänk lämnar du Dealsbot och omfattas av den externa webbplatsens villkor och integritetspolicy. Vi skickar inte in formulärdata till Amazon från Dealsbot.</p><h2>Cookies och loggar</h2><p>Driftleverantören kan behandla tekniska loggar för säkerhet och felsökning. Cookies och lokal lagring kan också behandlas av externa tjänster som används på webbplatsen, enligt deras villkor och integritetspolicy.</p><h2>Frågor</h2><p>Kontakta redaktionen på <a class="text-link" href="mailto:kontakt@deals.symeri.se">kontakt@deals.symeri.se</a> om du har frågor om integritet.</p></div></main>${footer()}`;
  return pageDocument({ title: 'Integritetspolicy | Dealsbot', description: 'Dealsbots integritetspolicy, information om Google AdSense, cookies och samtycke.', canonical: `${baseUrl}/integritet`, body });
}

function toolsPage() {
  const body = `${siteHeader()}<main class="container page tools-page"><p class="eyebrow">Praktiskt beslutsstöd</p><h1>Verktyg för smartare köp</h1><p class="lead">Använd kalkylerna före du klickar vidare till en återförsäljare. Verktygen är gratis, fungerar lokalt i webbläsaren och är utan affiliatelänkar.</p><div class="tools-grid"><section class="tool-card"><p class="eyebrow">Beräkning</p><h2>Powerbankkalkylator</h2><p>Uppskatta användbar energi efter omvandlingsförluster. Jämför enhetens batteri, powerbankens kapacitet och en antagen verkningsgrad.</p><div class="tool-result"><strong>Kapacitet → uppskattad användning</strong><span>Detta är en uppskattning, inte ett laboratorietest.</span></div></section><section class="tool-card"><p class="eyebrow">Jämförelse</p><h2>Totalkostnad över tid</h2><p>Lägg samman inköpspris och återkommande kostnader under samma användningsperiod.</p><div class="tool-result"><strong>Inköp + drift = jämförbar kostnad</strong><span>Använd samma tidsperiod för alla alternativ.</span></div></section><section class="tool-card"><p class="eyebrow">Beslutsstöd</p><h2>Jämförelsemall</h2><p>Vikta pris, passform, underhåll och livslängd efter ditt behov. Poängen är personlig och inte ett objektivt testbetyg.</p><div class="tool-result"><strong>Gör kompromissen synlig</strong><span>Markera okända uppgifter i stället för att gissa.</span></div></section></div><div class="prose tool-method"><h2>Så ska resultaten läsas</h2><p>Resultaten är uppskattningar baserade på värden du själv skriver in. De ersätter inte bruksanvisningar, säkerhetsinformation, aktuell prisinformation eller oberoende tester. Vi sparar inte formulärvärdena och använder inte verktygen för att rangordna produkter automatiskt.</p><h2>En enkel arbetsgång</h2><p>Beskriv först behovet, skriv därefter dina måstekrav och använd sedan ett verktyg för att göra kompromissen synlig. Om två alternativ hamnar nära varandra bör du välja det där specifikationer, returvillkor och service går att verifiera bäst.</p></div></main>${footer()}`;
  return pageDocument({ title: 'Verktyg för smartare köp | Dealsbot', description: 'Gratis kalkyler och jämförelsemallar utan affiliatelänkar från Dealsbot.', canonical: `${baseUrl}/verktyg/`, body, structuredData: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Verktyg för smartare köp', url: `${baseUrl}/verktyg/`, isAccessibleForFree: true } });
}

function dealsPage() {
  const body = `${siteHeader()}<main class="container page"><p class="eyebrow">Prisbevakning</p><h1>Aktuella fynd</h1><p class="lead">De senast registrerade fynden från vår bevakning. Priser och lager kan ändras snabbt – öppna alltid återförsäljaren för aktuell information.</p><div class="deal-status">Aktuella fynd laddas från vår prisbevakning. Kontrollera alltid pris, variant, leveransvillkor och lager hos återförsäljaren före köp.</div>${affiliateNote()}</main>${footer()}`;
  return pageDocument({ title: 'Aktuella fynd och prisbevakning | Dealsbot', description: 'Aktuella Amazon.se-fynd med tydlig pris- och affiliateinformation från Dealsbot.', canonical: `${baseUrl}/deals`, body });
}

function writePage(relativePath, html) {
  const target = path.join(buildDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

writePage('index.html', homePage());
writePage(path.join('guider', 'index.html'), guideIndexPage());
for (const article of articles) {
  writePage(path.join('guider', article.slug, 'index.html'), guideArticlePage(article));
}
writePage(path.join('om-oss', 'index.html'), aboutPage());
writePage(path.join('kontakt', 'index.html'), contactPage());
writePage(path.join('integritet', 'index.html'), privacyPage());
writePage(path.join('verktyg', 'index.html'), toolsPage());
writePage(path.join('deals', 'index.html'), dealsPage());

const urls = [
  `${baseUrl}/`,
  `${baseUrl}/guider/`,
  `${baseUrl}/deals`,
  `${baseUrl}/om-oss`,
  `${baseUrl}/kontakt`,
  `${baseUrl}/integritet`,
  `${baseUrl}/verktyg/`,
  ...articles.map(article => `${baseUrl}/guider/${article.slug}/`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeHtml(url)}</loc></url>`).join('')}</urlset>\n`;
fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), sitemap);

console.log(`Prerendered ${articles.length + 7} public pages and sitemap.xml`);
