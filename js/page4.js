addMdToPage(`
# Påverkar utbildningsnivån valdeltagandet i Sveriges kommuner?

**Hypotes:** Vi undersöker om valdeltagandet är lägre i kommuner med låg utbildningsnivå och högre i kommuner med hög utbildningsnivå. 
Vi jämför valdeltagandet i olika kommuner och län mellan 2018 och 2022 och försöker identifiera trender som kan relatera till utbildningsnivåer. 
Faktorer som coronapandemin och förändrad valrörelse kan ha påverkat resultaten mellan dessa två valår.

`);
// Hämta kommuner från SQLite.
dbQuery.use('eligibleVotersEducation-sqlite');
const municipalityRows = await dbQuery(`
  SELECT DISTINCT municipality FROM eligibleVotersEducation ORDER BY municipality
`);
const municipalities = municipalityRows.map(row => row.municipality);

// Hämta kommun-län från geo-mysql.
dbQuery.use('geo-mysql');
const geoRows = await dbQuery(`SELECT municipality, county FROM geoData`);
const geoMap = {};
geoRows.forEach(row => {
  geoMap[row.municipality] = row.county;
});

// Lägg till saknade kommuner manuellt.
[
  { municipality: 'Järfälla', county: 'Stockholm' },
  { municipality: 'Salem', county: 'Stockholm' },
  { municipality: 'Tyresö', county: 'Stockholm' },
  { municipality: 'Sundbyberg', county: 'Stockholm' },
  { municipality: 'Solna', county: 'Stockholm' }
].forEach(({ municipality, county }) => {
  if (!geoMap[municipality]) {
    geoMap[municipality] = county;
  }
});

// Skapa en lista över län.
const counties = [...new Set(Object.values(geoMap))].sort();
const countyOptions = ['Samtliga län', ...counties];

// Dropdowns för år, län, kommun och utbildningsnivå. 
let yearOptions = ['2018', '2022', 'Samtliga år'];
let selectedYear = addDropdown('Välj år', yearOptions, '2018');
let selectedCounty = addDropdown('Välj län', countyOptions, 'Samtliga län');

// Filtrera kommuner baserat på valt län.
let filteredMunicipalities = selectedCounty === 'Samtliga län'
  ? municipalities
  : municipalities.filter(m => geoMap[m] === selectedCounty);

let municipalityOptions = ['Samtliga kommuner', ...filteredMunicipalities];
let selectedMunicipality = addDropdown('Välj kommun', municipalityOptions, 'Samtliga kommuner');

// Lägg till utbildningsnivå, dropdown.
let educationOptions = ['Förgymnasial utbildning', 'Eftergymnasial utbildning', 'Samtliga utbildningsnivåer'];
let selectedEducation = addDropdown('Välj utbildningsnivå', educationOptions, 'Förgymnasial utbildning');

// 
const educationValueMap = {
  'Förgymnasial utbildning': 'förgymnasial utbildning',
  'Eftergymnasial utbildning': 'eftergymnasial utbildning',
  'Samtliga utbildningsnivåer': ['förgymnasial utbildning', 'eftergymnasial utbildning'] // Samtliga utbildningar.
};

// Kön är total, kan ändras och ev lägga till dropdown. 
const selectedGenderDbValue = 'totalt';

// Baserat på användarens val.
const selectedEducationDbValue = educationValueMap[selectedEducation];

// 5. Hämta data från SQLite.
dbQuery.use('eligibleVotersEducation-sqlite');
let voterQuery = `
  SELECT municipality, educationLevel, votersPercent2018, votersPercent2022
  FROM eligibleVotersEducation
  WHERE gender = '${selectedGenderDbValue}'
`;

if (selectedYear !== 'Samtliga år') {
  voterQuery += ` AND votersPercent${selectedYear} IS NOT NULL`;
}
if (selectedMunicipality !== 'Samtliga kommuner') {
  voterQuery += ` AND municipality = '${selectedMunicipality}'`;
} else if (selectedCounty !== 'Samtliga län') {
  // Filtrera på alla kommuner i valt län.
  const municipalitiesInCounty = municipalities.filter(m => geoMap[m] === selectedCounty);
  const muniList = municipalitiesInCounty.map(m => `'${m}'`).join(', ');
  voterQuery += ` AND municipality IN (${muniList})`;
}
if (selectedEducation !== 'Samtliga utbildningsnivåer') {
  voterQuery += ` AND educationLevel = '${selectedEducationDbValue}'`;
}


let voterData = await dbQuery(voterQuery);

// Färger som används för varje utbildningsnivå.
const educationColors = {
  'Förgymnasial utbildning': '#6C8EBF',  // Blå 
  'Eftergymnasial utbildning': '#F2A65A',  // Orange
};

// Rita Diagram 1.
let chartData = [];

if (selectedYear === 'Samtliga år') {
  chartData = [['Kommun',
    { label: 'Förgymnasial 2018', type: 'number' },
    { type: 'string', role: 'tooltip', p: { html: true } },
    { label: 'Förgymnasial 2022', type: 'number' },
    { type: 'string', role: 'tooltip', p: { html: true } },
    { label: 'Eftergymnasial 2018', type: 'number' },
    { type: 'string', role: 'tooltip', p: { html: true } },
    { label: 'Eftergymnasial 2022', type: 'number' },
    { type: 'string', role: 'tooltip', p: { html: true } },
  ]];

  voterData.forEach(row => {
    const educationLevels = row.educationLevel.split(',');
    const isF = educationLevels.includes('förgymnasial utbildning');
    const isE = educationLevels.includes('eftergymnasial utbildning');

    if (isF || isE) {
      const chartRow = [row.municipality];

      // F = förgymnasial, E = eftergymnasial.
      const f18 = isF ? row.votersPercent2018 ?? 0 : 0;
      const f22 = isF ? row.votersPercent2022 ?? 0 : 0;
      const e18 = isE ? row.votersPercent2018 ?? 0 : 0;
      const e22 = isE ? row.votersPercent2022 ?? 0 : 0;

      chartRow.push(
        f18,
        `<div><b>${row.municipality}</b><br>Förgymnasial 2018<br>${f18}%</div>`,
        f22,
        `<div><b>${row.municipality}</b><br>Förgymnasial 2022<br>${f22}%</div>`,
        e18,
        `<div><b>${row.municipality}</b><br>Eftergymnasial 2018<br>${e18}%</div>`,
        e22,
        `<div><b>${row.municipality}</b><br>Eftergymnasial 2022<br>${e22}%</div>`
      );

      chartData.push(chartRow);
    }
  });

} else {
  // Om ett specifikt år väljs, visa en stapel per kommun.
  chartData = [['Kommun', 'Röstandel (%)', { type: 'string', role: 'tooltip', p: { html: true } }]];

  voterData.forEach(row => {
    const percent = selectedYear === '2018' ? row.votersPercent2018 : row.votersPercent2022;
    if (typeof percent === 'number' && !isNaN(percent)) {
      const tooltipHtml = `<div><b>${row.municipality}</b><br>${row.educationLevel}<br>${selectedYear}: ${percent}%</div>`;
      chartData.push([row.municipality, percent, tooltipHtml]);
    }
  });
}


drawGoogleChart({
  type: 'ColumnChart',
  data: chartData,
  options: {
    title: 'Röstandel per kommun och utbildningsnivå',
    height: 600,
    hAxis: {
      title: 'Kommun',
      slantedText: true,
    },
    vAxis: {
      title: 'Röstandel (%)',
      maxValue: 100,
      minValue: 0
    },
    tooltip: { isHtml: true },
    isStacked: false,
    bar: { groupWidth: '75%' },
    colors: selectedYear === 'Samtliga år'
      ? [
        educationColors['Förgymnasial utbildning'],
        educationColors['Förgymnasial utbildning'],
        educationColors['Eftergymnasial utbildning'],
        educationColors['Eftergymnasial utbildning']
      ]
      : [educationColors[selectedEducation] || '#4A90E2']
  }
});


// 10 kommuner (utifrån utbildningsnivå).
addMdToPage(`
  <br>
  <br>
  
 ### Valdeltagande i kommuner baserat på utbildningsnivå:

 <br>
  `)

// Rita diagram 2.

let selectedLevel = addDropdown('Välj nivå', ['Högst utbildningsnivå', 'Lägst utbildningsnivå'], 'Högst utbildningsnivå');

let topEducationLevel = selectedLevel === 'Högst utbildningsnivå'
  ? 'eftergymnasial utbildning'
  : 'förgymnasial utbildning';

let top10Query = `
  SELECT municipality, votersPercent2018, votersPercent2022
  FROM eligibleVotersEducation
  WHERE educationLevel = '${topEducationLevel}' AND gender = 'totalt'
`;

// Begränsa till valt län om "Samtliga kommuner" är valt.
if (selectedMunicipality === 'Samtliga kommuner' && selectedCounty !== 'Samtliga län') {
  const municipalitiesInCounty = municipalities.filter(m => geoMap[m] === selectedCounty);
  const muniList = municipalitiesInCounty.map(m => `'${m}'`).join(', ');
  top10Query += ` AND municipality IN (${muniList})`;
}

// Sortering.
top10Query += ` AND votersPercent2018 IS NOT NULL ORDER BY votersPercent2018 ${selectedLevel === 'Högst utbildningsnivå' ? 'DESC' : 'ASC'} LIMIT 10`;

let top10Data = await dbQuery(top10Query);



// Skapa data för båda åren.
let top10ChartData = [
  ['Kommun', '2018', '2022'],
  ...top10Data.map(row => [
    row.municipality,
    row.votersPercent2018,
    row.votersPercent2022
  ])
];


drawGoogleChart({
  type: 'ColumnChart',
  data: top10ChartData,
  options: {
    title: `Topp 10 kommuner med ${selectedLevel.toLowerCase()} – jämförelse 2018 och 2022`,
    height: 500,
    hAxis: {
      title: 'Kommun',
      slantedText: true
    },
    vAxis: {
      title: 'Röstandel (%)',
      minValue: 0,
      maxValue: 100
    },
    bar: { groupWidth: '75%' },
    colors: ['#6C8EBF', '#F2A65A'],  // Mjuk blå = 2018, Mjuk orange = 2022.
    isStacked: false
  }
});



// 8. Slutsats.
addMdToPage(`
<br>

  ### Möjliga orsaker till minskning i röstantal:

**Sociala faktorer:** Högutbildade individer har ofta bättre tillgång till politisk information och en högre benägenhet att känna ett politiskt ansvar, vilket kan leda till högre valdeltagande.
<br>
**Geografiska faktorer:** Län och kommuner med en högre andel eftergymnasial utbildning tenderar att ha högre valdeltagande. Detta kan bero på bättre tillgång till utbildning, information och politiska resurser.
<br>
**Pandemins påverkan:** 2022 års val kan ha påverkats av coronapandemins efterverkningar, där valdeltagandet var lägre i vissa regioner och bland äldre grupper som var mer isolerade eller osäkra på att rösta under dessa omständigheter. Det varierade beroende på region och utbildningsnivå.
<br>
## Slutsats:
**Sammanfattning:** Resultatet visar ett samband mellan valdeltagande och utbildningsnivå, där högutbildade tenderar att rösta mer än lågutbildade. Detta gäller särskilt för kommuner med högre andel eftergymnasialt utbildade invånare. Så detta är en bekräftelse på att vår hypotes stämmer.
För ett mer intressant resultat så skulle addering av mer specifika utbildingsormåden som forskarutbildning etc kunna ge en mer fördjupad insikt. 


`);
