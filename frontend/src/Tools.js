import React, { useState } from 'react';

function NumberField({ id, label, value, onChange, min = 0, max, step = 1, suffix }) {
  return <label className="tool-field" htmlFor={id}><span>{label}</span><div className="tool-input-wrap"><input id={id} type="number" min={min} max={max} step={step} value={value} onChange={event => onChange(event.target.value)} />{suffix && <small>{suffix}</small>}</div></label>;
}

function PowerBankCalculator() {
  const [deviceMah, setDeviceMah] = useState('4500');
  const [powerBankMah, setPowerBankMah] = useState('10000');
  const [efficiency, setEfficiency] = useState('75');
  const device = Math.max(Number(deviceMah) || 0, 0);
  const bank = Math.max(Number(powerBankMah) || 0, 0);
  const loss = Math.min(Math.max(Number(efficiency) || 0, 0), 100) / 100;
  const estimatedCharges = device > 0 ? (bank * loss) / device : 0;

  return <section className="tool-card" aria-labelledby="powerbank-title"><p className="eyebrow">Beräkning</p><h2 id="powerbank-title">Powerbankkalkylator</h2><p>En enkel uppskattning av användbar energi efter omvandlingsförluster. Det är inte ett laboratorietest och ersätter inte produktens dokumentation.</p><div className="tool-form"><NumberField id="device-mah" label="Enhetens batteri" value={deviceMah} onChange={setDeviceMah} min={1} suffix="mAh" /><NumberField id="powerbank-mah" label="Powerbankens kapacitet" value={powerBankMah} onChange={setPowerBankMah} min={1} suffix="mAh" /><NumberField id="powerbank-efficiency" label="Antagen verkningsgrad" value={efficiency} onChange={setEfficiency} min={1} max={100} suffix="%" /></div><div className="tool-result" aria-live="polite"><strong>{estimatedCharges.toFixed(1)} uppskattade laddningar</strong><span>Kontrollera alltid enhetens port, effekt och powerbankens specifikationer.</span></div></section>;
}

function TotalCostCalculator() {
  const [purchase, setPurchase] = useState('1000');
  const [months, setMonths] = useState('36');
  const [running, setRunning] = useState('20');
  const total = Math.max(Number(purchase) || 0, 0) + Math.max(Number(months) || 0, 0) * Math.max(Number(running) || 0, 0);
  const monthly = months > 0 ? total / Number(months) : 0;

  return <section className="tool-card" aria-labelledby="cost-title"><p className="eyebrow">Jämförelse</p><h2 id="cost-title">Totalkostnad över tid</h2><p>Räkna med inköp och återkommande kostnader innan du jämför två priser. Använd samma tidsperiod för alla alternativ.</p><div className="tool-form"><NumberField id="purchase-price" label="Inköpspris" value={purchase} onChange={setPurchase} min={0} step={50} suffix="kr" /><NumberField id="ownership-months" label="Användningstid" value={months} onChange={setMonths} min={1} suffix="månader" /><NumberField id="running-cost" label="Återkommande kostnad" value={running} onChange={setRunning} min={0} step={10} suffix="kr/månad" /></div><div className="tool-result" aria-live="polite"><strong>{total.toFixed(0)} kr totalt</strong><span>Det motsvarar {monthly.toFixed(0)} kr per månad under perioden.</span></div></section>;
}

function ComparisonMatrix() {
  const [first, setFirst] = useState('Alternativ A');
  const [second, setSecond] = useState('Alternativ B');
  const [weights, setWeights] = useState({ price: 3, fit: 5, maintenance: 3, longevity: 4 });
  const [scores, setScores] = useState({ first: { price: 3, fit: 3, maintenance: 3, longevity: 3 }, second: { price: 3, fit: 3, maintenance: 3, longevity: 3 } });
  const criteria = [['price', 'Pris'], ['fit', 'Passar behovet'], ['maintenance', 'Underhåll'], ['longevity', 'Livslängd']];
  const weighted = option => criteria.reduce((sum, [key]) => sum + Number(weights[key]) * Number(scores[option][key]), 0);
  const changeWeight = (key, value) => setWeights(current => ({ ...current, [key]: value }));
  const changeScore = (option, key, value) => setScores(current => ({ ...current, [option]: { ...current[option], [key]: value } }));

  return <section className="tool-card" aria-labelledby="matrix-title"><p className="eyebrow">Beslutsstöd</p><h2 id="matrix-title">Jämförelsemall</h2><p>Vikta det som faktiskt spelar roll för dig. Poängen är ett personligt beslutsstöd, inte ett objektivt produktbetyg.</p><div className="tool-form comparison-names"><label className="tool-field" htmlFor="first-option"><span>Första alternativet</span><input id="first-option" value={first} onChange={event => setFirst(event.target.value)} /></label><label className="tool-field" htmlFor="second-option"><span>Andra alternativet</span><input id="second-option" value={second} onChange={event => setSecond(event.target.value)} /></label></div><div className="comparison-table" role="table" aria-label="Jämförelsematris"><div className="comparison-row comparison-head" role="row"><span>Kriterium</span><span>Vikt 1–5</span><span>{first}</span><span>{second}</span></div>{criteria.map(([key, label]) => <div className="comparison-row" role="row" key={key}><span>{label}</span><input aria-label={`Vikt ${label}`} type="number" min="1" max="5" value={weights[key]} onChange={event => changeWeight(key, event.target.value)} /><input aria-label={`${first}: ${label}`} type="number" min="1" max="5" value={scores.first[key]} onChange={event => changeScore('first', key, event.target.value)} /><input aria-label={`${second}: ${label}`} type="number" min="1" max="5" value={scores.second[key]} onChange={event => changeScore('second', key, event.target.value)} /></div>)}</div><div className="tool-result comparison-result" aria-live="polite"><strong>{first}: {weighted('first')} poäng · {second}: {weighted('second')} poäng</strong><span>Om poängen ligger nära varandra är det ofta bättre att välja efter returvillkor, service eller vad som är lättast att verifiera.</span></div></section>;
}

export default function ToolsPage() {
  return <><header className="site-header"><div className="container nav-wrap"><a className="brand" href="/"><span className="brand-mark">D</span><span>Dealsbot</span></a><nav><a href="/">Hem</a><a href="/guider">Guider</a><a href="/verktyg">Verktyg</a><a href="/deals">Aktuella fynd</a><a href="/om-oss">Om oss</a></nav></div></header><main className="container page tools-page"><p className="eyebrow">Praktiskt beslutsstöd</p><h1>Verktyg för smartare köp</h1><p className="lead">Använd kalkylerna före du klickar vidare till en återförsäljare. Verktygen är gratis, fungerar lokalt i webbläsaren och är utan affiliatelänkar.</p><div className="tools-grid"><PowerBankCalculator /><TotalCostCalculator /><ComparisonMatrix /></div><div className="prose tool-method"><h2>Så ska resultaten läsas</h2><p>Resultaten är uppskattningar baserade på de värden du själv skriver in. De ersätter inte bruksanvisningar, säkerhetsinformation, aktuell prisinformation eller oberoende tester. Vi sparar inte formulärvärdena och använder inte verktygen för att rangordna produkter automatiskt.</p><h2>En enkel arbetsgång</h2><p>Beskriv först behovet, skriv därefter dina måstekrav och använd sedan ett verktyg för att göra kompromissen synlig. Om två alternativ hamnar nära varandra bör du välja det där specifikationer, returvillkor och service går att verifiera bäst.</p></div></main><footer className="site-footer"><div className="container footer-grid"><div><a className="brand footer-brand" href="/"><span className="brand-mark">D</span><span>Dealsbot</span></a><p>Praktiska köpguider för en mer genomtänkt vardag.</p></div><div><h3>Utforska</h3><a href="/guider">Guider</a><a href="/verktyg">Verktyg</a><a href="/deals">Aktuella fynd</a><a href="/om-oss">Om oss</a><a href="/kontakt">Kontakt</a></div><div><h3>Transparens</h3><p className="footer-note">Verktygen har inga affiliatelänkar. Amazon och Amazon.se är varumärken som tillhör Amazon.com, Inc. eller dess dotterbolag.</p><a href="/om-oss">Redaktionell policy</a><a href="/integritet">Integritetspolicy</a></div></div><div className="container copyright">© 2026 Dealsbot · Senast kontrollerad: september 2026</div></footer></>;
}
