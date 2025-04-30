addMdToPage(`
  ## Svenska riksdagsvalet och medelinkomsten i låginkomstkommuner under 2018–2022
  
  **Hyptoes Två:**
  *I de kommuner där inkomstökningen varit låg eller negativ har partierna i opposition(S, V, Mp och C) behållit eller ökat sitt stöd.*

  ________

`);

// läser in data från MongoDB
dbQuery.use('kommun-info-mongodb');

// skapa en dropdown för att välja år
let year = addDropdown('Välj år för att se medelinkomsten i svenska kommuner', [2018, 2022, 'Båda']);

// skapar en variabel som läser in specifikt inkomst per kommun från MongoDB, inkluderar alla kön
let kommuner18 = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' });

// skapar en variabel som mappar kommuner med medelinkomsten 2018
let meanIncomes18 = kommuner18.map(x => ({
  kommun: x.kommun,
  medelInkomst2018: x.medelInkomst2018
}));

// här filtrerar vi mededelinkomsten för att ta bort null-värden
meanIncomes18 = meanIncomes18.filter(x => x.medelInkomst2018 != null);

// Sorterar objekten i meanIncomes18 i fallande ordning efter medelInkomst 2018
meanIncomes18.sort((a, b) => b.medelInkomst2018 - a.medelInkomst2018);

// läser in data på nytt från MongoDB för att hämta medelinkomsten 2022, inkluderar alla kön
let kommuner = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' });

// skapar en variabel som mappar kommuner med medelinkomsten 2022
let meanIncomes = kommuner.map(x => ({
  kommun: x.kommun,
  medelInkomst2022: x.medelInkomst2022
}));

// här filtrerar vi mededelinkomsten för att ta bort null-värden
meanIncomes = meanIncomes.filter(x => x.medelInkomst2022 != null);

// sorterar objekten i meanIncomes2022 i fallande ordning efter medelinkomst 2022
meanIncomes.sort((a, b) => b.medelInkomst2022 - a.medelInkomst2022);

// skapar en ny variabel som visar upp inkomst per kommun, som sedan ska användas för att visa upp båda årens medelinkomst i en och samma tabell
let kommunerTotalt = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' });

// en ny lista (meanIncomesTotalt) med endast kommunnamn och medelinkomster för 2018 och 2022, där båda värdena finns. vi sorterar även bort null-värden
let meanIncomesTotalt = kommuner
  .filter(x => x.medelInkomst2018 != null && x.medelInkomst2022 != null)
  .map(x => ({
    kommun: x.kommun,
    medelInkomst2018: x.medelInkomst2018,
    medelInkomst2022: x.medelInkomst2022
  }));

// sorterar objekten i meanIncomesTotalt i fallande ordning efter medelInkomst 2022
meanIncomesTotalt.sort((a, b) => b.medelInkomst2022 - a.medelInkomst2022);

// hänger ihop med dropdown för att visa vilket år som ska visas i tabellen.
let chart1data, title;
if (year == 2018) {
  chart1data = meanIncomes18;
  title = 'Medelinkomst 2018 i alla kommuner (TSEK)';
}
else if (year == 2022) {
  chart1data = meanIncomes;
  title = 'Medelinkomst 2022 i alla kommuner (TSEK)';
}
else {
  chart1data = meanIncomesTotalt;
  title = 'Medelinkomst 2018 och 2022 i alla kommuner (TSEK)';
}

// nu kan vi äntligen visa upp all data i en tabell, som visualiseras bäst med hjälp av en kolumn tabell. 
drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(chart1data, 'Kommun', 'Medelinkomst (TSEK)'),
  options: {
    title,
    animation: { // lägger till en animation när diagrammet laddas
      startup: true,
      duration: 1000,
      easing: 'out'
    },
    height: 600,
    chartArea: { left: 75, bottom: 150, width: '90%' },
    legend: { position: 'top' }, // flyttar legend till toppen av diagrammet
    vAxis: { title: 'Inkomst (TSEK)' },
    hAxis: {
      title: 'Kommun',
      slantedText: true,
      slantedTextAngle: 45
    }
  }
});

addMdToPage(`
  <br/>`)

addMdToPage(`
  I denna hypotes undersöker vi olika aspekter av medelinkomsten i Sverige under åren 2018 och 2022, samt hur vissa kommuner röstat i de två senaste riksdagsvalen i relation till förändringar i medelinkomstnivån.

  Vi inleder med att presentera en översikt över samtliga svenska kommuners medelinkomst, rangordnade från högst till lägst. Diagrammet visar alla 290 kommuner som staplar, men på grund av utrymmesskäl är det interaktivt för att enklare hitta den kommun man söker. I diagrammet framträder en relativt jämn nivå bland kommunerna i mitten, men skillnaderna blir tydliga när vi exempelvis jämför Danderyd och Åsele.

  Vårt huvudsakliga fokus ligger på de kommuner med lägst inkomster. Vi har därför särskilt granskat de tio kommuner som 2018 hade den lägsta medelinkomsten. Samtliga av dessa kommuner har haft en positiv utveckling, med ökningar mellan 11,82 och 15,81 procent fram till 2022.
`)

addMdToPage(`
  <br/>`)


// nu ska vi läsa in datan igen från MongoDB, men nu vill vi ta reda på vilka 10 kolumner som har lägst medelinkomst 2018 och hur mycket de har ökat i procent till 2022.
let kommunerChange = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' });

// vi filtrerar bort null-värden
let filtrerade = kommunerChange.filter(x =>
  x.medelInkomst2018 != null &&
  x.medelInkomst2022 != null &&
  x.medelInkomst2018 !== 0
);

// skapar en ny variabel som ska räknar ut förändringen i procent mellan 2018 och 2022. 
let kommunerFörändring = filtrerade.map(x => {
  let förändring = ((x.medelInkomst2022 - x.medelInkomst2018) / x.medelInkomst2018) * 100;
  return {
    kommun: x.kommun,
    medelInkomst2018: x.medelInkomst2018,
    medelInkomst2022: x.medelInkomst2022,
    förändringProcent: parseFloat(förändring.toFixed(2))
  };
});

// sortera på 2018 års inkomst för att hitta kommuner med lägst nivå från början
kommunerFörändring.sort((a, b) => a.medelInkomst2018 - b.medelInkomst2018);

// ta ut de 10 kommuner som hade lägst inkomst 2018
let bottom10Change = kommunerFörändring.slice(0, 10);

// gör en tabell med både inkomster och procentuell förändring, samt de de 10 kommuner vi är mest intresserade av
tableFromData({
  data: bottom10Change,
  columnNames: [
    'Kommun',
    'Medelinkomst 2018 (TSEK)',
    'Medelinkomst 2022 (TSEK)',
    'Förändring (%)'
  ]
});


addMdToPage(`
  <br/>`)
addMdToPage(`
  Den procentuella förändringen i medelinkomsten visualiseras i grafen nedan.`)
addMdToPage(`
  <br/>`)

// visar upp datan som stapeldiagram (procentuell förändring)
drawGoogleChart({
  type: 'ColumnChart',
  data: [
    ['Kommun', 'Förändring (%)'],
    ...bottom10Change.map(x => [x.kommun, x.förändringProcent])
  ],
  options: {
    title: 'Procentuell förändring i medelinkomst (2018–2022) – Kommuner med lägst inkomst 2018',
    height: 500,
    chartArea: { left: 60, bottom: 120, width: '90%' },
    legend: { position: 'top' }, // flyttar legend till toppen av diagrammet
    hAxis: {
      title: 'Kommun',
    },
    vAxis: {
      title: 'Förändring (%)',
      viewWindow: { // behövde lägga in detta för att få rätt skala på y-axeln
        min: 0,
        max: 20
      }
    }
  }
});

// lägger in en liten break mellan tabeller
addMdToPage(`
  <br/>`)
addMdToPage(`Vi går därefter in på kärnan i hypotesen: hur har dessa kommuner röstat? Här framträder ett tydligt mönster där stödet huvudsakligen ligger hos Socialdemokraterna – med undantag för Perstorp, där Sverigedemokraterna är största parti. Perstorp, som är Skånes minsta kommun, har av Dagens Nyheter beskrivits som en "döende bruksort" med hög arbetslöshet.
`)
addMdToPage(`
  <br/>`)

// nu kan vi äntligen börja läsa in data från Neo4j, där vi ska hämta ut partiernas röster i de kommuner vi har valt att fokusera på.
dbQuery.use('riksdagsval-neo4j');

// här gör vi en cypher query som hämtar ut vad de 10 kommuner vi har valt ut bestämt sig för att rösta på i valet 2018 och 2022.
let rawResults = await dbQuery(`
  MATCH (n:Partiresultat)
  WHERE n.kommun IN ['Filipstad', 'Ljusnarsberg', 'Hultsfred', 'Perstorp', 'Hällefors', 'Högsby', 'Åsele', 'Bjurholm', 'Lessebo', 'Gullspång']
  RETURN n.kommun AS Kommun, n.parti AS Parti, n.roster2018 AS Röster_2018, n.roster2022 AS Röster_2022
`);

// skapar en tom lista för att spara de största partierna i varje kommun.
let topParties = [];

// grupperar alla rader i rawResults efter kommunnamn. Varje kommun får en lista med sina partier och röstsiffror.
let grouped = {};
for (let row of rawResults) {
  let kommun = row.Kommun;
  if (!grouped[kommun]) {
    grouped[kommun] = [];
  }
  grouped[kommun].push(row);
}

// för varje kommun: Hitta partiet som fick flest röster 2018 och lägg till detta parti(och dess röstsiffror) i topParties.
for (let kommun in grouped) {
  let top = grouped[kommun].reduce((max, current) => {
    return current.Röster_2018 > max.Röster_2018 ? current : max;
  });
  topParties.push({
    kommun: top.Kommun,
    parti: top.Parti,
    röster2018: top.Röster_2018,
    röster2022: top.Röster_2022
  });
}

// vi visar upp datan som vi sorterat i en tabell, där vi har kommunnamn, parti och röstsiffror för 2018 och 2022.
tableFromData({
  data: topParties,
  columnNames: ['Kommun', 'Parti', 'Röster 2018', 'Röster 2022']
});

// lägger in en liten break mellan tabeller
addMdToPage(`
  <br/>`)
addMdToPage(`Mellan 2018 och 2022 förlorar de tidigare ledande partierna viss väljarandel i dessa kommuner, med undantag för Sverigedemokraterna i Perstorp som istället stärker sitt stöd. Detta illustreras tydligare i nästa graf.`)
addMdToPage(`
  <br/>`)

// vi skapar en ny variabel där vi mappar efter de partier som fått flest röster i de kommuner som är i fokus. 
let combinedTopParties = [
  ...topParties.map(x => ({
    kommun: x.kommun,
    röster2018: x.röster2018,
    röster2022: x.röster2022
  }))
];

// nu kan vi visualisera datan med hjälp av ett stapeldiagram, där man kan se skillanderna visuellt mellan 2018 och 2022.
drawGoogleChart({
  type: 'ColumnChart',
  data: [
    ['Kommun', 'Röster 2018', 'Röster 2022'],
    ...combinedTopParties.map(x => [x.kommun, x.röster2018, x.röster2022])
  ],
  options: {
    title: 'Röster på största parti i top 10 kommuner med minst medelinkomst (2018 vs 2022)',
    height: 500,
    chartArea: { left: 90, bottom: 100, width: '90%' },
    vAxis: { title: 'Antal röster' },
    hAxis: {
      title: 'Kommun',
    },
    colors: ['#1f77b4', '#ff7f0e'],
    legend: { position: 'top' }
  }
});

// lägger in en liten break mellan tabeller
addMdToPage(`
  <br/>`)
addMdToPage(`Avslutningsvis visualiserar vi hur stödet för de två politiska blocken – Oppositionen och Regeringsunderlaget – har förändrats i de utvalda kommunerna. För tydlighetens skull definierar vi här blocken som:

* **Regeringsunderlag:** Moderaterna, Kristdemokraterna, Liberalerna, Sverigedemokraterna

* **Opposition:** Arbetarepartiet-Socialdemokraterna, Vänsterpartiet, Miljöpartiet, Centerpartiet

I diagrammet framgår att samtliga kommuner, trots att Socialdemokraterna tappat i stöd, ändå totalt sett ökat sitt stöd för oppositionen mellan de två riksdagsvalen.
`)

// nu ska vi hämta ut partiernas röster i de kommuner vi har valt att fokusera på men hjälp av en cypher query. 
let rawResultsGrouped = await dbQuery(`
  MATCH (n:Partiresultat)
  WHERE n.kommun IN ['Filipstad', 'Ljusnarsberg', 'Hultsfred', 'Perstorp', 'Hällefors', 'Högsby', 'Åsele', 'Bjurholm', 'Lessebo', 'Gullspång']
  AND n.parti IN ['Moderaterna', 'Kristdemokraterna', 'Liberalerna ', 'Sverigedemokraterna',
                  'Arbetarepartiet-Socialdemokraterna', 'Vänsterpartiet', 'Miljöpartiet', 'Centerpartiet']
  RETURN n.kommun AS Kommun, n.parti AS Parti, n.roster2018 AS Röster_2018, n.roster2022 AS Röster_2022
`);

// nedan skapar vi en ny variabel som grupperar partierna i två olika grupper: Regeringsunderlag och Opposition, för att det senare ska vara lättare att visualisera i ett stapeldiagram. 
let grupper = {
  'Hogerblocket': ['Moderaterna', 'Kristdemokraterna', 'Liberalerna ', 'Sverigedemokraterna'],
  'Mitten_Vansterblocket': ['Arbetarepartiet-Socialdemokraterna', 'Vänsterpartiet', 'Miljöpartiet', 'Centerpartiet']
};

// vi skapar en ny variabel som ska gruppera kommunerna, tar bort dubbletter och skapar en lista med unika kommuner.
let kommunerGrouped = [...new Set(rawResultsGrouped.map(x => x.Kommun))];

// skapar en start-array (chartData) som ser ut som en tabell. 
let chartData = [
  ['Kommun', 'Mitten-Vänsterblocket 2018', 'Mitten-Vänsterblocket 2022', 'Högerblocket 2018', 'Högerblocket 2022']
];

// För varje kommun räknas rösterna ihop, sorterat på opposition / regering och år, och sparas i en tabell(chartData) som kan användas för att vi sedan ska kunna rita ett diagram.
for (let kommun of kommunerGrouped) {
  let kommunData = rawResultsGrouped.filter(x => x.Kommun === kommun);

  let reg2018 = 0, reg2022 = 0, opp2018 = 0, opp2022 = 0;

  for (let row of kommunData) {
    if (grupper['Mitten_Vansterblocket'].includes(row.Parti)) {
      opp2018 += row.Röster_2018 || 0;
      opp2022 += row.Röster_2022 || 0;
    } else if (grupper['Hogerblocket'].includes(row.Parti)) {
      reg2018 += row.Röster_2018 || 0;
      reg2022 += row.Röster_2022 || 0;
    }
  }
  chartData.push([kommun, reg2018, reg2022, opp2018, opp2022]);
}

// tillslut kan vi visualisera datan igen i ett stapeldiagram, nu med passande färger för att visa upp höger och vänster sida i politiken. 
drawGoogleChart({
  type: 'ColumnChart',
  data: chartData,
  options: {
    title: 'Röster per block i top 10 kommuner med minst medelinkomst (2018 vs 2022)',
    height: 550,
    legend: { position: 'top' },
    chartArea: { left: 90, bottom: 100, width: '90%' },
    hAxis: {
      title: 'Kommun',
    },
    vAxis: { title: 'Antal röster' },
    colors: ['#e53935', '#ef5350', '#1e88e5', '#42a5f5',] // blå & röd skala
  }
});

addMdToPage(`
  <br/>`)
addMdToPage(`
  ## Sammanfattat: 
* Medelinkomsten har ökat i alla de undersökta låginkomstkommunerna mellan 2018 och 2022, med en ökning mellan nästan 12–16 %.

* Trots ökningen i inkomster, röstade dessa kommuner fortsatt huvudsakligen på Socialdemokraterna, vilket tyder på att inkomstökningen inte ledde till ett större stöd för partier på högerkanten.

* Perstorp är ett undantag: där ökade Sverigedemokraternas stöd tydligt, medan de traditionella partierna tappade.

* När man jämför den bredare grupperingens stöd ("Oppositionen" vs "Regeringsunderlaget") ser vi att Oppositionen totalt sett stärktes i dessa låginkomstkommuner, även om Socialdemokraterna tappade något i väljarstöd.

## Slutsats:
Resultaten stödjer i huvudsak hypotesen.
I kommuner med låg inkomstnivå och en relativt svag ökning av inkomster mellan 2018 och 2022 har oppositionens partier som helhet behållit eller förstärkt sitt stöd. Socialdemokraterna tappar i viss mån, men det kompenseras av ökat stöd för övriga oppositionspartier. Det finns dock avvikelser, exempelvis Perstorp, där utvecklingen istället gynnat ett parti inom regeringsunderlaget.`)

addMdToPage(`
  <br/>`)

