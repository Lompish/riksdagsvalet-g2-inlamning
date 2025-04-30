addMdToPage(`
# Inkomstökning och och partifördelning i Sverige 2018–2022
*I de kommuner där inkomsterna ökat mest har partier inom tidö-samarbetet (M, Kd, L & SD) fått ett ökat antal röster mellan valen 2018-2022.*
`);

// --- DROPDOWN ---
let val = addDropdown('Välj:', ['Start', 'Alla', 'Män', 'Kvinnor']);


// --- Hämta data ---
dbQuery.use('kommun-info-mongodb');
let inkomster = await dbQuery.collection('incomeByKommun').find({});

dbQuery.use('riksdagsval-neo4j');
let valresultat = await dbQuery('MATCH (n:Partiresultat) RETURN n');

// --- Sortera inkomstdata ---
function sorteraInkomst(kön) {
  return inkomster
    .filter(x => x.kon === kön)
    .map(x => ({
      kommun: x.kommun,
      inkomst2018: Number(x.medelInkomst2018),
      inkomst2022: Number(x.medelInkomst2022),
      förändringInkomstProcent: ((Number(x.medelInkomst2022) - Number(x.medelInkomst2018)) / Number(x.medelInkomst2018)) * 100
    }));
}

let inkomsterAlla = sorteraInkomst('totalt');
let inkomsterMän = sorteraInkomst('män');
let inkomsterKvinnor = sorteraInkomst('kvinnor');

// --- Valdata per kommun ---
let rösterPerKommun = {};
valresultat.forEach(x => {
  let kommun = x.kommun;
  if (!rösterPerKommun[kommun]) rösterPerKommun[kommun] = {};
  rösterPerKommun[kommun][x.parti] = {
    r2018: Number(x.roster2018?.toString().replace(/\s/g, '') || 0),
    r2022: Number(x.roster2022?.toString().replace(/\s/g, '') || 0)
  };
});

// --- Beräkna hela landet statistik ---
function beräknaLandData(inkomsterLista) {
  let genomsnittInkomstökning = inkomsterLista.reduce((sum, x) => sum + x.förändringInkomstProcent, 0) / inkomsterLista.length;

  let totalRöster = {};
  valresultat.forEach(x => {
    if (!totalRöster[x.parti]) totalRöster[x.parti] = { r2018: 0, r2022: 0 };
    totalRöster[x.parti].r2018 += Number(x.roster2018?.toString().replace(/\s/g, '') || 0);
    totalRöster[x.parti].r2022 += Number(x.roster2022?.toString().replace(/\s/g, '') || 0);
  });

  let starkast2018 = Object.entries(totalRöster).sort((a, b) => b[1].r2018 - a[1].r2018)[0]?.[0] || 'Okänd';
  let starkast2022 = Object.entries(totalRöster).sort((a, b) => b[1].r2022 - a[1].r2022)[0]?.[0] || 'Okänd';

  let tidöPartier = ['Moderaterna', 'Kristdemokraterna', 'Liberalerna ', 'Sverigedemokraterna'];
  let tidö2018 = tidöPartier.reduce((sum, p) => sum + (totalRöster[p]?.r2018 || 0), 0);
  let tidö2022 = tidöPartier.reduce((sum, p) => sum + (totalRöster[p]?.r2022 || 0), 0);
  let tidöFörändring = tidö2018 > 0 ? ((tidö2022 - tidö2018) / tidö2018) * 100 : 0;

  return {
    genomsnittInkomstökning,
    starkast2018,
    starkast2022,
    tidöFörändring,
    totalRöster
  };
}

let landAlla = beräknaLandData(inkomsterAlla);
let landMän = beräknaLandData(inkomsterMän);
let landKvinnor = beräknaLandData(inkomsterKvinnor);

// --- Kombinera kommunvis ---
function kombineraData(inkomsterLista) {
  return inkomsterLista.map(inkomst => {
    let röstdata = rösterPerKommun[inkomst.kommun] || {};

    let starkast2018 = null, starkast2022 = null;
    let max2018 = 0, max2022 = 0;
    for (let parti in röstdata) {
      if (röstdata[parti].r2018 > max2018) {
        max2018 = röstdata[parti].r2018;
        starkast2018 = parti;
      }
      if (röstdata[parti].r2022 > max2022) {
        max2022 = röstdata[parti].r2022;
        starkast2022 = parti;
      }
    }

    return {
      kommun: inkomst.kommun,
      förändringInkomstProcent: inkomst.förändringInkomstProcent,
      starkastParti2018: starkast2018 || 'Okänd',
      starkastParti2022: starkast2022 || 'Okänd'
    };
  });
}

// --- Välj data beroende på dropdown ---
let kombineradLista;
let landData;

if (val === 'Start') {
  addMdToPage(`*Visa de 10 kommunerna med högst genomsnittlig inkomstökning för alla, för bara män eller för bara kvinnor.*`);
} else if (val === 'Alla') {
  kombineradLista = kombineraData(inkomsterAlla);
  landData = landAlla;
} else if (val === 'Män') {
  kombineradLista = kombineraData(inkomsterMän);
  landData = landMän;
} else if (val === 'Kvinnor') {
  kombineradLista = kombineraData(inkomsterKvinnor);
  landData = landKvinnor;
}

function beräknaTidöAndel(kommunObjekt) {
  let kommun = kommunObjekt.kommun;
  let röster = rösterPerKommun[kommun] || {};
  let tidöPartier = ['Moderaterna', 'Kristdemokraterna', 'Liberalerna ', 'Sverigedemokraterna'];

  let total = Object.values(röster).reduce((sum, partidata) => sum + (partidata.r2022 || 0), 0);
  let tidöRöster = tidöPartier.reduce((sum, parti) => sum + (röster[parti]?.r2022 || 0), 0);

  return total > 0 ? (tidöRöster / total) * 100 : 0; // procent
}

// Sortera ut röstandel för alla kommuner
let kommunMedTidö = kombineradLista.map(k => ({
  kommun: k.kommun,
  inkomstökning: k.förändringInkomstProcent,
  tidöAndel: beräknaTidöAndel(k)
}));

// Dela på median
let sorterade = [...kommunMedTidö].sort((a, b) => a.inkomstökning - b.inkomstökning);
let medianIndex = Math.floor(sorterade.length / 2);
let låg = sorterade.slice(0, medianIndex);
let hög = sorterade.slice(medianIndex);

// Extrahera tidöandelar
let andelarLåg = låg.map(k => k.tidöAndel);
let andelarHög = hög.map(k => k.tidöAndel);

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr, avg) {
  return arr.reduce((sum, x) => sum + (x - avg) ** 2, 0) / (arr.length - 1);
}

function tTest(group1, group2) {
  let m1 = mean(group1);
  let m2 = mean(group2);
  let v1 = variance(group1, m1);
  let v2 = variance(group2, m2);
  let n1 = group1.length;
  let n2 = group2.length;

  let t = (m1 - m2) / Math.sqrt((v1 / n1) + (v2 / n2));
  return {
    tVärde: t.toFixed(3),
    medelHög: m1.toFixed(2),
    medelLåg: m2.toFixed(2)
  };
}

let resultat = tTest(andelarHög, andelarLåg);

addMdToPage(`
### T-test: Genomsnittlig röstandel på högerblocken i kommuner med hög vs låg inkomstökning
- Genomsnittlig röstandel på högerblocket (hög inkomstökning): **${resultat.medelHög}%**
- Genomsnittlig röstandel på högerblocket (låg inkomstökning): **${resultat.medelLåg}%**
- t-värde: **${resultat.tVärde}**

> *Ett högt t-värde tyder på en signifikant skillnad mellan grupperna.*
`);


// --- Topp 10 kommuner ---
let topLista = kombineradLista.sort((a, b) => b.förändringInkomstProcent - a.förändringInkomstProcent).slice(0, 10);

// --- Visa tabell ---
// --- Visa landets sammanfattning ---

addMdToPage(`## Kommuner med störst inkomstökning (${val.toLowerCase()})`);

tableFromData({
  data: topLista.map(x => ({
    Kommun: x.kommun,
    'Inkomstökning (%)': x.förändringInkomstProcent.toFixed(1) + '%',
  })),
  columnNames: ['Kommun', 'Inkomstökning (%)']
});

addMdToPage(`- Genomsnittlig inkomstökning i hela landet (${val.toLowerCase()}): ${landData.genomsnittInkomstökning.toFixed(1)}%
- Genomsnittligt ökat stöd för Tidö-partier i hela landet (${val.toLowerCase()}): ${landData.tidöFörändring.toFixed(1)}%

`);


// --- Tidö vs Opposition graf (kommuner) ---
let rowData2018 = [
  ['Kommun', 'Högerblocket 2018 (%)', 'Mitten-vänsterblocket 2018 (%)'],
  ...topLista.map(x => {
    let kommun = x.kommun;
    let röster = rösterPerKommun[kommun] || {};
    let tidöPartier = ['Moderaterna', 'Kristdemokraterna', 'Liberalerna ', 'Sverigedemokraterna'];
    let oppositionPartier = ['Arbetarepartiet-Socialdemokraterna', 'Vänsterpartiet', 'Miljöpartiet de gröna', 'Centerpartiet'];

    let tidö2018 = tidöPartier.reduce((sum, p) => sum + (röster[p]?.r2018 || 0), 0);
    let opp2018 = oppositionPartier.reduce((sum, p) => sum + (röster[p]?.r2018 || 0), 0);
    let total2018 = tidö2018 + opp2018;

    return [
      kommun,
      total2018 > 0 ? (tidö2018 / total2018) * 100 : 0,
      total2018 > 0 ? (opp2018 / total2018) * 100 : 0
    ];
  })
];

let rowData2022 = [
  ['Kommun', 'Mitten-vänsterblocket 2022 (%)', 'Högerblocket 2022 (%)'],
  ...topLista.map(x => {
    let kommun = x.kommun;
    let röster = rösterPerKommun[kommun] || {};
    let tidöPartier = ['Moderaterna', 'Kristdemokraterna', 'Liberalerna ', 'Sverigedemokraterna'];
    let oppositionPartier = ['Arbetarepartiet-Socialdemokraterna', 'Vänsterpartiet', 'Miljöpartiet de gröna', 'Centerpartiet'];

    let tidö2022 = tidöPartier.reduce((sum, p) => sum + (röster[p]?.r2022 || 0), 0);
    let opp2022 = oppositionPartier.reduce((sum, p) => sum + (röster[p]?.r2022 || 0), 0);
    let total2022 = tidö2022 + opp2022;

    return [
      kommun,
      total2022 > 0 ? (tidö2022 / total2022) * 100 : 0,
      total2022 > 0 ? (opp2022 / total2022) * 100 : 0
    ];
  })
];

// --- Nu ritar vi enligt knappsystemet ---
let data = [];
data[0] = google.visualization.arrayToDataTable(rowData2022); // Default = 2022
data[1] = google.visualization.arrayToDataTable(rowData2018); // Byta till 2018

let options = {
  title: 'Högerblocket vs Mitten-vänsterblocket - 2022',
  height: 600,
  vAxis: { title: 'Andel (%)', format: '#\'%\'' },
  hAxis: { slantedText: true, slantedTextAngle: 45 },
  colors: ['#dc3912', '#3366cc'],
  legend: { position: 'top' },
  animation: {
    duration: 800,
    easing: 'out'
  }
};

let current = 0; // 0 = 2022, 1 = 2018

// Skapa en div och en knapp i sidan om inte finns
let containerId = 'chart-container';
let buttonId = 'switchButton';
if (!document.getElementById(containerId)) {
  let container = document.createElement('div');
  container.id = containerId;
  document.body.appendChild(container);

  let button = document.createElement('button');
  button.id = buttonId;
  button.innerText = 'Visa 2018';
  button.style.margin = '10px';
  document.body.appendChild(button);
}

let chart = new google.visualization.ColumnChart(document.getElementById(containerId));
let button = document.getElementById(buttonId);

function drawChart() {
  button.disabled = true;
  google.visualization.events.addListener(chart, 'ready', function () {
    button.disabled = false;
    button.innerText = current === 0 ? 'Visa 2018' : 'Visa 2022';
  });

  options.title = current === 0 ? 'Högerblocket vs Mitten-vänsterblocket - 2022' : 'Högerblocket vs Mitten-vänsterblocket - 2018';
  chart.draw(data[current], options);
}

drawChart();

button.onclick = function () {
  current = 1 - current;
  drawChart();
};

let partier = [
  'Arbetarepartiet-Socialdemokraterna', 'Moderaterna', 'Sverigedemokraterna',
  'Centerpartiet', 'Vänsterpartiet', 'Kristdemokraterna',
  'Miljöpartiet de gröna', 'Liberalerna '
];

function skapaPartidata(år) {
  let header = ['Kommun', ...partier];
  let rows = topLista.map(x => {
    let kommun = x.kommun;
    let röster = rösterPerKommun[kommun] || {};

    let total = partier.reduce((sum, p) => sum + (röster[p]?.[`r${år}`] || 0), 0);

    return [
      kommun,
      ...partier.map(p => total > 0 ? (röster[p]?.[`r${år}`] || 0) / total * 100 : 0)
    ];
  });

  return [header, ...rows];
}

let partidata = [];
partidata[0] = google.visualization.arrayToDataTable(skapaPartidata(2022));
partidata[1] = google.visualization.arrayToDataTable(skapaPartidata(2018));

let partiOptions = {
  colors: [
    "#d9373d", // Socialdemokraterna
    "#3168af", // Moderaterna
    "#f8d447", // Sverigedemokraterna
    "#3b8658", // Centerpartiet
    "#bb2a2b", // Vänsterpartiet
    "#274289", // Kristdemokraterna
    "#9fce63", // Miljöpartiet
    "#59a1d8"  // Liberalerna
  ],

  title: 'Partifördelning - 2022',
  height: 600,
  vAxis: { title: 'Andel (%)', format: '#\'%\'' },
  hAxis: { slantedText: true, slantedTextAngle: 45 },
  isStacked: true,
  legend: { position: 'top', maxLines: 2 },
  animation: {
    duration: 800,
    easing: 'out'
  }
};

// Container & knapp för partigraf
let partContainerId = 'partigraf-container';
let partButtonId = 'partSwitchButton';

if (!document.getElementById(partContainerId)) {
  let container = document.createElement('div');
  container.id = partContainerId;
  document.body.appendChild(container);

  let button = document.createElement('button');
  button.id = partButtonId;
  button.innerText = 'Visa 2018';
  button.style.margin = '10px';
  document.body.appendChild(button);
}

let partChart = new google.visualization.ColumnChart(document.getElementById(partContainerId));
let partButton = document.getElementById(partButtonId);
let partCurrent = 0;

function drawPartiChart() {
  partButton.disabled = true;
  google.visualization.events.addListener(partChart, 'ready', function () {
    partButton.disabled = false;
    partButton.innerText = partCurrent === 0 ? 'Visa 2018' : 'Visa 2022';
  });

  partiOptions.title = partCurrent === 0 ? 'Partifördelning - 2022' : 'Partifördelning - 2018';
  partChart.draw(partidata[partCurrent], partiOptions);
}

drawPartiChart();

partButton.onclick = function () {
  partCurrent = 1 - partCurrent;
  drawPartiChart();
};

// Skapa en ny div längst ner
let kommentarDiv = document.createElement('div');
kommentarDiv.innerHTML = `<p><b>Sammanfattning:</b><br>-I de 10 kommunerna där män haft störst inkomstökning kan man inte dra slutsatsen att högerblocket fått ökat stöd - tvärtom visar vår graf att stödet sjunkit i nästan alla dessa kommuner.<br>
Pajala och Övertorneå är de enda kommunerna i vår lista där högerblocket fått ökat stöd, och dessa kommunerna är de enda Norrländska kommunerna i listan.<br>
<br>
I de 10 kommunerna där kvinnor har störst inkomstökning har högerblocket fått ett ökat stöd i drygt hälften av kommunerna: Båstad, Åsele, Övertorneå, Nacka, Sjöbo, och Lidingö.<br>
Många av dessa kommuner hör till kommunerna man ofta tänker på som “rika kommuner”, och här har stödet för högerblocket varit starkt sedan länge.<br>
<br>
<b>T-test:</b><br>Vi har gjort ett t-test på de kommuner som haft högst och lägst inkomstökning för att se om fördelningen är normalfördelad.<br>
Enligt vårt t-test är skillnaderna störst i kommunerna där kvinnor haft högst inkomstökning med ett t-värde på <b>1.523 mot</b> t-värdet på <b>0.348</b> i kommunerna där män haft högst inkomstökning.<br>
Om vi tittar på den genomsnittliga inkomstökningen för hela landet är t-värdet på <b>1.186</b>. Detta indikerar att vår hypotes inte stämmer: i kommuner där man haft högst inkomstökning har inte högerblocket fått ett ökat stöd.</br>


</p>`;
kommentarDiv.style.marginTop = '20px';
document.body.appendChild(kommentarDiv);
