import './App.css';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';

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

const articles = [
  {
    slug: 'sa-valjer-du-en-bra-powerbank',
    category: 'Teknik',
    title: 'Så väljer du en bra powerbank utan att köpa fel',
    excerpt: 'Kapacitet är bara början. Här går vi igenom USB-C, laddningseffekt, storlek och vad siffrorna faktiskt betyder.',
    readTime: '8 min läsning',
    date: '2026-07-18',
    sections: [
      ['Börja med användningen', 'En powerbank för en weekendresa behöver inte ha samma egenskaper som en modell för en bärbar dator. För mobil och hörlurar räcker ofta en kompakt modell, medan datorladdning kräver både högre kapacitet och stöd för USB-C Power Delivery. Skriv ner vilka enheter du faktiskt vill ladda innan du börjar jämföra modeller.'],
      ['mAh är inte hela sanningen', 'Kapacitet anges oftast i mAh, men den siffran berättar inte direkt hur många laddningar du får. Spänningen skiljer sig mellan battericeller och USB-utgång, och en del energi försvinner i omvandlingen. Jämför därför testresultat och tillverkarnas angivna utgående energi när det finns tillgängligt.'],
      ['Titta på portarna', 'USB-C är praktiskt eftersom samma kabel kan användas för laddning och för att ladda andra enheter. Kontrollera om USB-C-porten bara är en ingång eller om den också kan leverera ström. För en laptop behöver du dessutom kontrollera watt-talet och om din dator accepterar laddning via USB-C.'],
      ['Vår checklista', 'Välj en modell som har tydlig specifikation, överströmsskydd och en storlek du faktiskt kommer att bära med dig. En mindre powerbank som följer med på resan är mer användbar än en större modell som lämnas hemma.']
    ]
  },
  {
    slug: 'guide-till-ljudreducerande-horlurar',
    category: 'Teknik',
    title: 'Guide: ljudreducerande hörlurar för jobb, resa och vardag',
    excerpt: 'Aktiv brusreducering, passform och mikrofonkvalitet spelar olika stor roll beroende på hur du använder hörlurarna.',
    readTime: '9 min läsning',
    date: '2026-07-12',
    sections: [
      ['Vad betyder brusreducering?', 'Aktiv brusreducering använder mikrofoner för att mäta omgivande ljud och skapa en motsignal. Tekniken fungerar ofta bäst mot jämna ljud, som flygplansmotorer eller ventilation. Den ersätter inte en bra passform och tar inte bort alla röster eller plötsliga ljud.'],
      ['In-ear eller over-ear?', 'In-ear-modeller är lätta och smidiga, men passformen är avgörande. Over-ear-hörlurar kan ge bättre fysisk isolering och längre batteritid, men tar mer plats. Prova gärna flera storlekar på öronproppar och kontrollera returvillkoren.'],
      ['För samtal och arbete', 'Om hörlurarna ska användas i möten bör du läsa oberoende tester av mikrofonen. Specifikationer om codec och batteritid säger inte hur tydlig du låter i ett bullrigt rum. Multipoint-stöd kan också vara värdefullt om du växlar mellan dator och telefon.'],
      ['Köp med rätt förväntan', 'Dyrare betyder inte automatiskt bättre för alla. Prioritera passform och stabil anslutning om du pendlar, och mikrofon samt komfort om hörlurarna främst ska användas vid skrivbordet.']
    ]
  },
  {
    slug: 'checklista-for-en-ergonomisk-arbetsplats',
    category: 'Arbetsplats',
    title: 'Checklista för en mer ergonomisk arbetsplats hemma',
    excerpt: 'Små justeringar av skärm, stol, ljus och pauser kan göra större skillnad än att byta ut allt på en gång.',
    readTime: '7 min läsning',
    date: '2026-07-06',
    sections: [
      ['Ställ in skärmen först', 'Överkanten på skärmen bör normalt hamna ungefär i ögonhöjd när du sitter upprätt. Avståndet ska göra texten lätt att läsa utan att du skjuter fram huvudet. En separat skärm eller ett stativ kan vara mer prisvärt än ett nytt skrivbord.'],
      ['Stolen är inte hela lösningen', 'En bra stol hjälper, men även den bästa stolen blir obekväm om fötterna inte har stöd eller om bordet är för högt. Justera i ordningen fötter, sits, ryggstöd och armstöd. Variera positionen i stället för att försöka sitta helt stilla.'],
      ['Ljus och pauser', 'Undvik reflexer i skärmen genom att placera den vinkelrätt mot ett fönster. Använd jämn belysning och planera korta pauser där du reser dig. Ergonomi handlar om hur arbetsplatsen används över tid, inte om en enskild produkt.']
    ]
  },
  {
    slug: 'sa-valjer-du-lampor-for-smarta-hemmet',
    category: 'Hem',
    title: 'Så väljer du belysning till det smarta hemmet',
    excerpt: 'Kom igång med rätt sockel, färgtemperatur och styrning – utan att bygga ett onödigt komplicerat system.',
    readTime: '8 min läsning',
    date: '2026-06-29',
    sections: [
      ['Börja med en enda plats', 'Välj ett rum där smart belysning löser ett konkret problem, till exempel en hall som ska tändas automatiskt eller en läslampa som ska kunna dimras. Ett litet test gör det lättare att upptäcka kompatibilitetsproblem innan du köper många lampor.'],
      ['Kontrollera sockel och ljusstyrka', 'E27 och GU10 är vanliga men inte utbytbara. Kontrollera även maximal fysisk storlek, lumen och om lampan är avsedd för dimmer. Färgtemperatur anges i kelvin: lägre värden ger varmare ljus och högre värden ett vitare ljus.'],
      ['Hub eller direktanslutning?', 'Vissa lampor ansluter direkt via Wi-Fi eller Bluetooth, andra använder ett separat nav. Ett nav kan ge stabilare system och fler automatiseringar, men innebär ytterligare kostnad. Välj ett system som passar dina befintliga telefoner och röstassistenter.']
    ]
  },
  {
    slug: 'airfryer-vad-ska-man-tanka-pa',
    category: 'Kök',
    title: 'Airfryer: vad ska man tänka på före köp?',
    excerpt: 'Kapacitet, rengöring och korgens utformning är ofta viktigare än maximalt watt-tal.',
    readTime: '7 min läsning',
    date: '2026-06-21',
    sections: [
      ['Kapacitet i praktiken', 'Tillverkarnas portionsangivelser är inte alltid jämförbara. En bred korg kan vara bättre för grönsaker och pommes än en hög, smal behållare. Tänk på vad du oftast lagar och hur många omgångar du vill slippa köra.'],
      ['Rengöring och material', 'En korg som är lätt att ta ur och rengöra kommer sannolikt att användas oftare. Kontrollera vilka delar som tål diskmaskin och om beläggningen har tydliga skötselråd. Undvik metallredskap om tillverkaren avråder från det.'],
      ['Mer än bara pommes', 'En airfryer kan passa för uppvärmning, rostning och mindre bakprojekt, men resultatet varierar med modell och mängd. Läs recept och tester som använder samma modell eller liknande korgstorlek.']
    ]
  },
  {
    slug: 'resa-med-barn-praktisk-packlista',
    category: 'Resa',
    title: 'Praktisk packlista för resor med barn',
    excerpt: 'En realistisk packlista prioriterar sådant som löser problem under resan, inte prylar för varje tänkbar situation.',
    readTime: '6 min läsning',
    date: '2026-06-14',
    sections: [
      ['Dela upp packningen', 'Ha en liten väska för det som behövs under själva resan och en större väska för resten. I den lättillgängliga väskan kan du lägga ombyte, våtservetter, vattenflaska, snacks och något lugnt att göra.'],
      ['Välj tåliga saker', 'Produkter som används på resa bör vara enkla att rengöra, tåla att tappas och inte kräva många lösa delar. Smarta detaljer är bra, men enkelhet minskar risken att något saknas när ni behöver det.'],
      ['Planera för pauser', 'På längre resor gör regelbundna pauser mer nytta än att försöka underhålla barnet hela tiden. Anpassa listan efter transportmedel, väder och boende i stället för att följa en generell lista blint.']
    ]
  },
  {
    slug: 'vad-gor-en-bra-ryggsack',
    category: 'Vardag',
    title: 'Vad gör en bra ryggsäck för pendling?',
    excerpt: 'Laptopfack, bärkomfort och väderskydd är viktigare än många små extrafack.',
    readTime: '8 min läsning',
    date: '2026-06-07',
    sections: [
      ['Mät innan du köper', 'Kontrollera måtten på datorn och jämför dem med det faktiska laptopfackets mått. En ryggsäck som marknadsförs för 15 tum kan vara för trång för en tjockare arbetsdator.'],
      ['Bärkomfort', 'Breda, justerbara axelremmar och en ryggpanel som inte skaver märks mer än ett långt fackregister. Om du cyklar kan bröstrem eller höftrem ge bättre stabilitet, medan en smalare profil passar bättre i kollektivtrafik.'],
      ['Väderskydd', 'Vattenavvisande tyg är inte samma sak som vattentät konstruktion. Kontrollera sömmar, dragkedjor och om regnskydd ingår. Packa elektronik i ett separat fodral även om väskan har väderskydd.']
    ]
  },
  {
    slug: 'kaffebryggare-for-hemmet',
    category: 'Kök',
    title: 'Kaffebryggare för hemmet: välj efter dina vanor',
    excerpt: 'Rätt bryggare handlar om mängd, rengöring och hur mycket kontroll du vill ha – inte bara om effekt.',
    readTime: '7 min läsning',
    date: '2026-05-30',
    sections: [
      ['Hur mycket kaffe brygger du?', 'En liten bryggare kan vara bättre för en person eller ett litet kök, eftersom kaffet inte behöver stå länge. För flera personer är kanna, värmehållning och snabb påfyllning viktigare.'],
      ['Rengöring och kalk', 'Kalk påverkar både smak och livslängd. Välj en modell där filterhållare och kanna är lätta att skölja och följ tillverkarens avkalkningsintervall. Hårt vatten kan kräva tätare underhåll.'],
      ['Filter och temperatur', 'Pappersfilter ger enkel rengöring, medan permanenta filter kan minska förbrukningen men behöver rengöras noggrant. Om du bryr dig om smak, leta efter oberoende tester av bryggtemperatur och jämnhet.']
    ]
  },
  {
    slug: 'barnsakerhet-vid-kop-av-teknik',
    category: 'Familj',
    title: 'Barnsäkerhet vid köp av teknik och prylar',
    excerpt: 'Ålder, smådelar, batterier och laddare bör vägas in innan en produkt hamnar i hemmet.',
    readTime: '6 min läsning',
    date: '2026-05-22',
    sections: [
      ['Läs varningarna', 'Åldersmärkning är en säkerhetsuppgift, inte bara en rekommendation om svårighetsgrad. Läs alltid produktens varningar och kontrollera om delar kan lossna vid normal användning.'],
      ['Knappcellsbatterier', 'Produkter med knappceller kräver extra uppmärksamhet. Kontrollera att batterifacket är skruvat eller på annat sätt barnsäkert och förvara lösa batterier utom räckhåll.'],
      ['Laddning under uppsikt', 'Låt inte barn använda laddare eller batteriprodukter utan uppsikt om tillverkaren inte uttryckligen avsett dem för det. Använd rätt laddare och byt kablar som blivit skadade.']
    ]
  },
  {
    slug: 'sa-jamfor-du-produkter-pa-natet',
    category: 'Köpguide',
    title: 'Så jämför du produkter på nätet på ett smartare sätt',
    excerpt: 'En enkel metod för att skilja relevanta skillnader från marknadsföringsord och snabba impulsköp.',
    readTime: '9 min läsning',
    date: '2026-05-15',
    sections: [
      ['Skriv krav före pris', 'Definiera tre måste-krav och tre önskemål innan du tittar på pris. Då blir det lättare att upptäcka när en billigare produkt faktiskt saknar en viktig funktion.'],
      ['Jämför samma mått', 'Jämför vikt mot vikt, batteritid mot batteritid och faktisk storlek mot faktisk storlek. Var försiktig med ord som “pro”, “ultra” och “premium” om de inte åtföljs av mätbara skillnader.'],
      ['Läs både positiva och negativa omdömen', 'Kundomdömen kan visa återkommande problem, men de är inte ett laboratorietest. Leta efter mönster över tid och kontrollera om recensionerna gäller rätt modell och rätt storlek.'],
      ['Tänk på total kostnad', 'Räkna med tillbehör, förbrukningsvaror, frakt och eventuell service. Den lägsta prislappen är inte alltid den lägsta kostnaden över produktens livslängd.']
    ]
  }
];

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

function GuideArticle() { const { slug } = useParams(); const article = articles.find(item => item.slug === slug); if (!article) return <NotFound />; return <><Header /><main className="container article-page"><Link className="back-link" to="/guider">← Till alla guider</Link><p className="eyebrow">{article.category} · {article.readTime}</p><h1>{article.title}</h1><p className="article-intro">{article.excerpt}</p><div className="article-meta">Senast uppdaterad {new Date(article.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })} · Av Dealsbot-redaktionen</div><div className="article-body">{article.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div><AffiliateNote /></main><Footer /></>; }

function Deals() { return <><Header /><main className="container page"><p className="eyebrow">Prisbevakning</p><h1>Aktuella fynd</h1><p className="lead">De 50 senast registrerade fynden från vår bevakning. Priser och lager kan ändras snabbt – öppna alltid återförsäljaren för aktuell information.</p><DealGrid limit={50} /><AffiliateNote /></main><Footer /></>; }

function About() { return <><Header /><main className="container narrow-page page"><p className="eyebrow">Om Dealsbot</p><h1>Råd som börjar i vardagen</h1><p className="lead">Dealsbot är en svensk köpguide för dig som vill förstå en produkt innan du beställer den.</p><div className="prose"><h2>Vårt uppdrag</h2><p>Vi vill göra produktjämförelser mer användbara. Därför fokuserar vi på användning i verkligheten: mått, underhåll, kompatibilitet, begränsningar och vilken typ av person produkten passar.</p><h2>Så arbetar vi</h2><p>Vi börjar med ett vardagsproblem och samlar sedan de specifikationer som löser det. Vi skiljer på fakta från tillverkaren, redaktionella bedömningar och sådant som behöver verifieras vid varje köp. Vi använder inte betalda omdömen och vi lovar inte att en viss produkt är rätt för alla.</p><h2>Transparens</h2><p>Vissa länkar är affiliatelänkar. Det innebär att vi kan få ersättning om du genomför ett köp efter att ha klickat på en länk. Det påverkar inte vad vi väljer att skriva om. Produktpriser, lagerstatus och villkor kan ändras hos återförsäljaren.</p><h2>Kontakt</h2><p>Har du hittat ett fel eller vill föreslå ett ämne? Kontakta redaktionen via den kanal som anges på webbplatsens officiella kontaktsida.</p></div></main><Footer /></>; }

function Contact() { return <><Header /><main className="container narrow-page page"><p className="eyebrow">Kontakt</p><h1>Hör av dig</h1><p className="lead">Har du hittat ett fel, vill föreslå ett ämne eller vill diskutera ett samarbete? Skicka ett meddelande till redaktionen.</p><div className="prose"><h2>Redaktionella rättelser</h2><p>Beskriv gärna vilken sida det gäller, vad som behöver rättas och vilken källa du hänvisar till. Vi prioriterar sakliga rättelser av priser, specifikationer och länkar.</p><h2>Kontaktadress</h2><p><a className="text-link" href="mailto:kontakt@deals.symeri.se">kontakt@deals.symeri.se</a></p></div></main><Footer /></>; }

function Privacy() { return <><Header /><main className="container narrow-page page"><p className="eyebrow">Integritet</p><h1>Integritetspolicy</h1><div className="prose"><h2>Vilka uppgifter samlas in?</h2><p>Dealsbot samlar inte in personuppgifter genom konto eller kommentarsfunktion på den här webbplatsen. Om du kontaktar redaktionen behandlas uppgifterna endast för att besvara ditt meddelande.</p><h2>Google AdSense och samtycke</h2><p>För att finansiera webbplatsen använder Dealsbot Google AdSense för att visa annonser. Google och Googles annonsteknikpartners kan behandla uppgifter som IP-adress, information om enhet och webbläsare samt uppgifter om hur webbplatsen och annonser används. Beroende på ditt samtycke kan cookies och lokal lagring användas för att leverera, mäta och anpassa annonser.</p><p>För besökare i Europeiska ekonomiska samarbetsområdet, Storbritannien och Schweiz visas ett samtyckesmeddelande via Googles certifierade samtyckeshanteringsplattform (CMP). Där kan du samtycka, avstå eller hantera dina val. Om du avstår kan annonser vara icke-personanpassade eller inte visas. Läs mer i <a className="text-link" href="https://policies.google.com/technologies/ads?hl=sv" target="_blank" rel="noopener noreferrer">Googles information om annonser och integritet</a>.</p><h2>Externa länkar</h2><p>När du följer en affiliatelänk lämnar du Dealsbot och omfattas av den externa webbplatsens villkor och integritetspolicy. Vi skickar inte in formulärdata till Amazon från Dealsbot.</p><h2>Cookies och loggar</h2><p>Driftleverantören kan behandla tekniska loggar för säkerhet och felsökning. Cookies och lokal lagring kan också behandlas av externa tjänster som används på webbplatsen, enligt deras villkor och integritetspolicy.</p><h2>Frågor</h2><p>Kontakta redaktionen på <a className="text-link" href="mailto:kontakt@deals.symeri.se">kontakt@deals.symeri.se</a> om du har frågor om integritet.</p></div></main></>}

function Footer() { return <footer className="site-footer"><div className="container footer-grid"><div><Link className="brand footer-brand" to="/"><span className="brand-mark">D</span><span>Dealsbot</span></Link><p>Praktiska köpguider för en mer genomtänkt vardag.</p></div><div><h3>Utforska</h3><Link to="/guider">Guider</Link><Link to="/deals">Aktuella fynd</Link><Link to="/om-oss">Om oss</Link><Link to="/kontakt">Kontakt</Link></div><div><h3>Transparens</h3><p className="footer-note">Amazon och Amazon.se är varumärken som tillhör Amazon.com, Inc. eller dess dotterbolag. Dealsbot är inte en del av Amazon.</p><Link to="/om-oss">Redaktionell policy</Link><Link to="/integritet">Integritetspolicy</Link></div></div><div className="container copyright">© {new Date().getFullYear()} Dealsbot · Senast kontrollerad: juli 2026</div></footer>; }

function NotFound() { return <><Header /><main className="container page not-found"><p className="eyebrow">404</p><h1>Sidan hittades inte</h1><p>Den här länken verkar inte finnas längre.</p><Link className="button" to="/">Till startsidan</Link></main><Footer /></>; }

export default function App() { return <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/guider" element={<Guides />} /><Route path="/guider/:slug" element={<GuideArticle />} /><Route path="/deals" element={<Deals />} /><Route path="/om-oss" element={<About />} /><Route path="/kontakt" element={<Contact />} /><Route path="/integritet" element={<Privacy />} /><Route path="*" element={<NotFound />} /></Routes></BrowserRouter>; }
