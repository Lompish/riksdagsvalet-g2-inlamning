addMdToPage(`
  ## Hypotes Två: 
  I de kommuner där inkomstökningen varit låg eller negativ har partierna i opposition(S, V, Mp och C) behållit eller ökat sitt stöd.

  Vad är medelinkomsten i alla kommuner? 

  I den här hypotesen har vi två aspekter att ha i åtanke: Ska vi jämföra de top 10 kommunerna vars medelinkomst har ökat minst mellan 2018 och 2022 eller hitta den kommuner som tjänar minst och se hur mycket deras medelinkomst har ökat? Samt därefter se om partistödet har ökat för de partier som är i opposition.
  
  ### Plan A: 

  Steg 1: Hitta de kommuner där inkomsten har ökat som minst mellan år 2018 och 2022. Håller oss till top 10.

  Steg 2: Jämför med partistödet i dessa kommuner. Har de partier som är i opposition bibehållit sitt stöd?

  Steg 3: Rita ut det i ett stapeldiagram där vi ser hur mycket partierna ökat sitt stöd i dessa kommuner.


  ### Plan B:

  Steg 1: Hitta de kommuner som tjänar minst under båda årtalen och se hur mycket deras medelinkomst har ökat. 

  Steg 2: Jämför med partistödet i dessa kommuner. Har de partier som är i opposition bibehållit sitt stöd?

  Steg 3: Rita ut det i ett stapeldiagram där vi ser hur mycket partierna ökat sitt stöd i dessa kommuner.
`);

// steg 1
//Vad är medelinkomsten i alla kommuner under 2018 och 2022?

dbQuery.use('kommun-info-mongodb');

let year = addDropdown('År', [2018, 2022, 'Båda']);

let kommuner18 = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

let meanIncomes18 = kommuner18.map(x => ({
  kommun: x.kommun,
  medelInkomst2018: x.medelInkomst2018
}));


meanIncomes18 = meanIncomes18.filter(x => x.medelInkomst2018 != null);

meanIncomes18.sort((a, b) => b.medelInkomst2018 - a.medelInkomst2018);


let kommuner = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })


let meanIncomes = kommuner.map(x => ({
  kommun: x.kommun,
  medelInkomst2022: x.medelInkomst2022
}));

meanIncomes = meanIncomes.filter(x => x.medelInkomst2022 != null);

meanIncomes.sort((a, b) => b.medelInkomst2022 - a.medelInkomst2022);

let kommunerTotalt = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })
  .toArray();

let meanIncomesTotalt = kommuner
  .filter(x => x.medelInkomst2018 != null && x.medelInkomst2022 != null)
  .map(x => ({
    kommun: x.kommun,
    medelInkomst2018: x.medelInkomst2018,
    medelInkomst2022: x.medelInkomst2022
  }));

meanIncomesTotalt.sort((a, b) => b.medelInkomst2022 - a.medelInkomst2022);

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


drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(chart1data, 'Kommun', 'Medelinkomst (TSEK)'),
  options: {
    title,
    height: 600,
    chartArea: { left: 60, bottom: 150, width: '80%' },
    vAxis: { title: 'Inkomst (TSEK)' },
    hAxis: {
      slantedText: true,
      slantedTextAngle: 45
    }
  }
});

/*
// tabell ovan 
addMdToPage(`
  <br/>`)


let kommunerTop10 = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

let meanIncomesTop10 = kommunerTop10
  .filter(x => x.medelInkomst2018 != null)
  .map(x => ({
    kommun: x.kommun,
    medelInkomst2018: x.medelInkomst2018
  }));

meanIncomesTop10.sort((a, b) => a.medelInkomst2018 - b.medelInkomst2018);

let bottom10 = meanIncomesTop10.slice(0, 10);

*/
/*
tableFromData({
  data: bottom10,
  columnNames: ['Kommun', 'Medelinkomst 2018 (TSEK)']
});

// tabell ovan
*/
/*
addMdToPage(`
  <br/>`)

let kommunerTop102022 = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

let meanIncomesTop102022 = kommunerTop102022
  .filter(x => x.medelInkomst2018 != null)
  .map(x => ({
    kommun: x.kommun,
    medelInkomst2022: x.medelInkomst2022
  }));

meanIncomesTop102022.sort((a, b) => a.medelInkomst2022 - b.medelInkomst2022);

let bottom2022 = meanIncomesTop102022.slice(0, 10);

tableFromData({
  data: bottom2022,
  columnNames: ['Kommun', 'Medelinkomst 2022 (TSEK)']
});
*/
/* 
// tabell ovan

addMdToPage(`
  <br/>`)

let kommunerProcent = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

// Räkna ut procentuell förändring mellan 2018 och 2022
let kommunerMedFörändring = kommunerProcent
  .filter(x => x.medelInkomst2018 != null && x.medelInkomst2022 != null && x.medelInkomst2018 !== 0)
  .map(x => {
    let procentFörändring = ((x.medelInkomst2022 - x.medelInkomst2018) / x.medelInkomst2018) * 100;
    return {
      kommun: x.kommun,
      medelInkomst2018: x.medelInkomst2018,
      medelInkomst2022: x.medelInkomst2022,
      förändringProcent: parseFloat(procentFörändring.toFixed(2))
    };
  });

// Sortera efter minst ökning (eller minskning först)
kommunerMedFörändring.sort((a, b) => a.förändringProcent - b.förändringProcent);

let bottom10Procent = kommunerMedFörändring.slice(0, 10);

// Visa som tabell
tableFromData({
  data: bottom10Procent,
  columnNames: [
    'Kommun',
    'Medelinkomst 2018 (TSEK)',
    'Medelinkomst 2022 (TSEK)',
    'Förändring (%)'
  ]
});
*/
// tabell ovan

addMdToPage(`
  <br/>`)

// Hämta all data (vi tar bara en gång, inte två gånger)
let kommunerChange = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

// Filtrera bort poster utan inkomstuppgifter
let filtrerade = kommunerChange.filter(x =>
  x.medelInkomst2018 != null &&
  x.medelInkomst2022 != null &&
  x.medelInkomst2018 !== 0
);

// Räkna ut procentuell förändring
let kommunerFörändring = filtrerade.map(x => {
  let förändring = ((x.medelInkomst2022 - x.medelInkomst2018) / x.medelInkomst2018) * 100;
  return {
    kommun: x.kommun,
    medelInkomst2018: x.medelInkomst2018,
    medelInkomst2022: x.medelInkomst2022,
    förändringProcent: parseFloat(förändring.toFixed(2))
  };
});

// Sortera på 2018 års inkomst för att hitta kommuner med lägst nivå från början
kommunerFörändring.sort((a, b) => a.medelInkomst2018 - b.medelInkomst2018);

// Ta ut de 10 kommuner som hade lägst inkomst 2018
let bottom10Change = kommunerFörändring.slice(0, 10);

// Visa tabell med både inkomster och procentuell förändring
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

// Visa som stapeldiagram (procentuell förändring)
drawGoogleChart({
  type: 'ColumnChart',
  data: [
    ['Kommun', 'Förändring (%)'],
    ...bottom10Change.map(x => [x.kommun, x.förändringProcent])
  ],
  options: {
    title: 'Procentuell förändring i medelinkomst (2018–2022) – Kommuner med lägst inkomst 2018',
    height: 500,
    chartArea: { left: 60, bottom: 120, width: '80%' },
    vAxis: {
      title: 'Förändring (%)', viewWindow: {
        min: 0,
        max: 20
      }
    },
    hAxis: { slantedText: true, slantedTextAngle: 45 }
  }
});

addMdToPage(`
  <br/>`)

dbQuery.use('riksdagsval-neo4j');

let rawResults = await dbQuery(`
  MATCH (n:Partiresultat)
  WHERE n.kommun IN ['Filipstad', 'Ljusnarsberg', 'Hultsfred', 'Perstorp', 'Hällefors', 'Högsby', 'Åsele', 'Bjurholm', 'Lessebo', 'Gullspång']
  RETURN n.kommun AS Kommun, n.parti AS Parti, n.roster2018 AS Röster_2018, n.roster2022 AS Röster_2022
`);

// Grupp per kommun och hitta det parti med flest röster 2018
let topParties = [];

let grouped = {};
for (let row of rawResults) {
  let kommun = row.Kommun;
  if (!grouped[kommun]) {
    grouped[kommun] = [];
  }
  grouped[kommun].push(row);
}

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

tableFromData({
  data: topParties,
  columnNames: ['Kommun', 'Parti', 'Röster 2018', 'Röster 2022']
});

addMdToPage(`
  <br/>`)

let combinedTopParties = [
  ...topParties.map(x => ({
    kommun: x.kommun,
    röster2018: x.röster2018,
    röster2022: x.röster2022
  }))
];

drawGoogleChart({
  type: 'ColumnChart',
  data: [
    ['Kommun', 'Röster 2018', 'Röster 2022'],
    ...combinedTopParties.map(x => [x.kommun, x.röster2018, x.röster2022])
  ],
  options: {
    title: 'Röster på största parti i varje kommun (2018 vs 2022)',
    height: 500,
    chartArea: { left: 60, bottom: 120, width: '80%' },
    vAxis: { title: 'Antal röster' },
    hAxis: {
      title: 'Kommun',
      slantedText: true,
      slantedTextAngle: 45
    },
    colors: ['#1f77b4', '#ff7f0e'],
    legend: { position: 'top' },
    bar: { groupWidth: '75%' },
    isStacked: false
  }
});

addMdToPage(`
  <br/>`)


/*
let rawResultsTot = await dbQuery(`
  MATCH (n:Partiresultat)
  WHERE n.kommun IN ['Filipstad', 'Ljusnarsberg', 'Hultsfred', 'Perstorp', 'Hällefors', 'Högsby', 'Åsele', 'Bjurholm', 'Lessebo', 'Gullspång']
  AND n.parti IN ['Sverigedemokraterna', 'Vänsterpartiet', 'Miljöpartiet', 'Centerpartiet', 'Arbetarepartiet-Socialdemokraterna']
  RETURN n.kommun AS Kommun, n.parti AS Parti, n.roster2018 AS Röster_2018, n.roster2022 AS Röster_2022
`);
*/
/*
tableFromData({
  data: rawResultsTot,
  columnNames: ['Kommun', 'Parti', 'Röster 2018', 'Röster 2022']
});
*/
/*
// Förbered datan
let chartData = [
  ['Kommun', 'Sverigedemokraterna 2018', 'Sverigedemokraterna 2022',
    'Vänsterpartiet 2018', 'Vänsterpartiet 2022',
    'Miljöpartiet 2018', 'Miljöpartiet 2022',
    'Centerpartiet 2018', 'Centerpartiet 2022',
    'Socialdemokraterna 2018', 'Socialdemokraterna 2022']
];

let kommunerParti = [...new Set(rawResultsTot.map(x => x.Kommun))];
let partier = [
  'Sverigedemokraterna',
  'Vänsterpartiet',
  'Miljöpartiet',
  'Centerpartiet',
  'Arbetarepartiet-Socialdemokraterna'
];

for (let kommun of kommunerParti) {
  let row = [kommun];
  for (let parti of partier) {
    let result = rawResultsTot.find(x => x.Kommun === kommun && x.Parti === parti);
    row.push(result?.Röster_2018 || 0);
    row.push(result?.Röster_2022 || 0);
  }
  chartData.push(row);
}

drawGoogleChart({
  type: 'ColumnChart',
  data: chartData,
  options: {
    title: 'Riksdagsröster per parti och kommun (2018 vs 2022)',
    height: 600,
    isStacked: false,
    chartArea: { left: 60, bottom: 150, right: 30, top: 50 },
    hAxis: { slantedText: true, slantedTextAngle: 45 },
    vAxis: { title: 'Antal röster' },
    bar: { groupWidth: '75%' }
  }
});
*/

let rawResultsGrouped = await dbQuery(`
  MATCH (n:Partiresultat)
  WHERE n.kommun IN ['Filipstad', 'Ljusnarsberg', 'Hultsfred', 'Perstorp', 'Hällefors', 'Högsby', 'Åsele', 'Bjurholm', 'Lessebo', 'Gullspång']
  AND n.parti IN ['Moderaterna', 'Kristdemokraterna', 'Liberalerna', 'Sverigedemokraterna',
                  'Arbetarepartiet-Socialdemokraterna', 'Vänsterpartiet', 'Miljöpartiet', 'Centerpartiet']
  RETURN n.kommun AS Kommun, n.parti AS Parti, n.roster2018 AS Röster_2018, n.roster2022 AS Röster_2022
`);

let grupper = {
  'Regeringsunderlag': ['Moderaterna', 'Kristdemokraterna', 'Liberalerna', 'Sverigedemokraterna'],
  'Opposition': ['Arbetarepartiet-Socialdemokraterna', 'Vänsterpartiet', 'Miljöpartiet', 'Centerpartiet']
};

let kommunerGrouped = [...new Set(rawResultsGrouped.map(x => x.Kommun))];

let chartData = [
  ['Kommun', 'Opposition 2018', 'Opposition 2022', 'Regeringsunderlag 2018', 'Regeringsunderlag 2022']
];

for (let kommun of kommunerGrouped) {
  let kommunData = rawResultsGrouped.filter(x => x.Kommun === kommun);

  let reg2018 = 0, reg2022 = 0, opp2018 = 0, opp2022 = 0;

  for (let row of kommunData) {
    if (grupper['Opposition'].includes(row.Parti)) {
      opp2018 += row.Röster_2018 || 0;
      opp2022 += row.Röster_2022 || 0;
    } else if (grupper['Regeringsunderlag'].includes(row.Parti)) {
      reg2018 += row.Röster_2018 || 0;
      reg2022 += row.Röster_2022 || 0;
    }
  }

  chartData.push([kommun, reg2018, reg2022, opp2018, opp2022]);
}

drawGoogleChart({
  type: 'ColumnChart',
  data: chartData,
  options: {
    title: 'Röster per block i kommuner (2018 vs 2022)',
    height: 600,
    isStacked: false,
    chartArea: { left: 100, bottom: 150, right: 10, top: 50 },
    hAxis: { slantedText: true, slantedTextAngle: 45 },
    vAxis: { title: 'Antal röster' },
    bar: { groupWidth: '75%' },
    colors: ['#e53935', '#ef5350', '#1e88e5', '#42a5f5',] // blå & röd skala
  }
});
