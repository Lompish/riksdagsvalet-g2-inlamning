
addMdToPage(`

## Valdeltagande i relation till arbetslöshet 

<br>

* **Kan vi hitta en tydlig korrelation mellan arbetslöshet och hur benägna människor är att rösta?**

* **Är valdeltagandet lägre i kommuner med hög arbetslöshet?** 

* **Finns det en förändring över de olika åren?** 

<br>

#### Hypotes:

Vi tror oss kunna hitta ett ganska starkt samband mellan arbetslöshet och valdeltagande, där *hög* arbetslöshet påverkar valdeltagandet *negativt* och vice versa. Dvs i kommuner med *låg* arbetslöshet kommer benägenheten att gå till valurnorna vara *högre*.

**Låt oss undersöka:**

När vi tittar på datan finner vi att valdeltagandet i Sverige är högt: 

`);

//Unemployed

dbQuery.use('unemployed-sqlite');

let unemployed2018And2022 = await dbQuery(`
SELECT 
  municipality, 
  ROUND(AVG(unemployedTotal)) AS unemployed, 
  SUBSTRING(period,1,4) AS year
FROM unemployed
GROUP BY municipality, year;
`);

let unemployed2018 = unemployed2018And2022
  .filter(x => x.year == '2018')
  .map(({ municipality, unemployed }) => ({ municipality, unemployed }));

let unemployed2022 = unemployed2018And2022
  .filter(x => x.year == '2022')
  .map(({ municipality, unemployed }) => ({ municipality, unemployed }));

let totalUnemployed = unemployed2018And2022
  .map(x => ({ municipality: x.municipality, unemployed2018: x.unemployed }))
  .map(x => ({ ...x, unemployed2022: unemployed2022.find(y => y.municipality == x.municipality).unemployed }));

// Turnout  

dbQuery.use('eligibleVotersAge-sqlite');

let turnout2018 = await dbQuery(`
SELECT 
  municipality, 
  votersPercent2018 AS turnout,
  '2018' AS year

FROM eligibleVotersAge
WHERE age = 'samtliga åldrar'
GROUP BY municipality
`);

let turnout2022 = await dbQuery(`
SELECT 
  municipality, 
  votersPercent2022 AS turnout,
  '2022' AS year
FROM eligibleVotersAge
WHERE age = 'samtliga åldrar'
GROUP BY municipality
`);

let combinedTurnout = [...turnout2018, ...turnout2022]

//Population

dbQuery.use('population-sqlite');

let population2018And2022 = await dbQuery(`  
SELECT 
  municipality, 
  '2018' AS year, 
  SUM(population2018) AS population
FROM population
WHERE age BETWEEN 18 AND 100
GROUP BY municipality

UNION

SELECT 
  municipality, 
  '2022' AS year, 
  SUM(population2022) AS population
FROM population
WHERE age BETWEEN 18 AND 100
GROUP BY municipality;
`);

let inPercent = unemployed2018And2022
  .map(x => ({
    ...x, population: population2018And2022
      .find(y => x.year == y.year && x.municipality == y.municipality)?.population
  }))
  .filter(x => x.population)
  .map(x => ({ ...x, unemployedPercent: x.unemployed * 100 / x.population }))
  .map(({ municipality, year, unemployedPercent }) => ({ municipality, year, unemployedPercent }))
  .map(x => ({ ...x, turnout: combinedTurnout.find(y => x.year == y.year && x.municipality == y.municipality).turnout }))

let inPercent2018 = inPercent.filter(x => x.year == 2018).map(({ municipality, unemployedPercent, turnout }) => ({ municipality, unemployedPercent: unemployedPercent, turnout }))
let inPercent2022 = inPercent.filter(x => x.year == 2022).map(({ municipality, unemployedPercent, turnout }) => ({ municipality, unemployedPercent, turnout }))

inPercent2018.sort((a, b) => a.unemployedPercent > b.unemployedPercent ? 1 : -1)

inPercent2022.sort((a, b) => a.unemployedPercent > b.unemployedPercent ? 1 : -1)

let unemployment2018 = inPercent2018.map(x => x.unemployedPercent)


let topTenLowest2018 = inPercent2018.slice(0, 10)
let lowUnemployment2018 = inPercent2018.slice(0, 96)
let mediumUnemployment2018 = inPercent2018.slice(96, 192)
let highUnemployment2018 = inPercent2018.slice(192)
let topTenHighest2018 = inPercent2018.slice(-10)

let lowUnemployment2022 = inPercent2022.slice(0, 96)
let mediumUnemployment2022 = inPercent2022.slice(96, 192)
let highUnemployment2022 = inPercent2022.slice(192)
let topTenLowest2022 = inPercent2022.slice(0, 10)
let topTenHighest2022 = inPercent2022.slice(-10)

let unemploymentGroups = [
  { label: 'lowUnemployment2018', data: lowUnemployment2018 },
  { label: 'mediumUnemployment2018', data: mediumUnemployment2018 },
  { label: 'highUnemployment2018', data: highUnemployment2018 },
  { label: 'topTenLowest2018', data: topTenLowest2018 },
  { label: 'topTenHighest2018', data: topTenHighest2018 }
]

let unemplymentGroups2022 = [
  { label: 'lowUnemployment2022', data: lowUnemployment2022 },
  { label: 'mediumUnemployment2022', data: mediumUnemployment2022 },
  { label: 'highUnemployment2022', data: highUnemployment2022 },
  { label: 'topTenLowest2022', data: topTenLowest2022 },
  { label: 'topTenHighest2022', data: topTenHighest2022 }
]

let unemploymentGroupsByYear = {
  2018: [
    { label: 'Hög', data: highUnemployment2018 },
    { label: 'Låg', data: lowUnemployment2018 },
    { label: 'Medelmåttig', data: mediumUnemployment2018 }

  ],
  2022: [
    { label: 'Hög', data: highUnemployment2022 },
    { label: 'Låg', data: lowUnemployment2022 },
    { label: 'Medelmåttig', data: mediumUnemployment2022 }
  ]
};

let unemploymentAndTurnoutByYear = {
  2018: inPercent2018
    .map(({ municipality, unemployedPercent, turnout }) => ({
      municipality,
      unemployedPercent,
      turnout
    })),
  2022: inPercent2022
    .map(({ municipality, unemployedPercent, turnout }) => ({
      municipality,
      unemployedPercent,
      turnout
    }))
};


let selectedYearForFullChart = addDropdown('Valår', [2018, 2022]);

let dataForYear = unemploymentAndTurnoutByYear[selectedYearForFullChart];

let chartReadyData = makeChartFriendly(dataForYear);
chartReadyData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];


drawGoogleChart({
  type: 'ColumnChart',
  data: chartReadyData,
  options: {
    title: `Arbetslöshet och valdeltagande samtliga kommuner ${selectedYearForFullChart}.`,
    legend: { position: 'right' },
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    vAxis: {
      title: 'Valdeltagande (procent)',
      minValue: 0
    },
    colors: ['green', 'orange']
  }
});

addMdToPage(`
  <br>
  
**Den lägsta siffran i vårt dataset är från valet 2022**, där *Södertälje* tar jumboplatsen med sina 71 procent. De hade då också en av landets högsta arbetslöshetssiffror på 7,25 procent.

Det högsta valdeltagandet har *Danderyd*, som 2018 kom upp i hela 94 procents valdeltagande. De har också en av landets lägsta nivåer av arbetslöshet.

Detta ser ut att vara en tydlig skillnad!
`);

let municipalityChartYear = addDropdown('År för vald kommun', [2018, 2022]);
let fullYearData = unemploymentAndTurnoutByYear[municipalityChartYear]; // updated for dropdown

let municipalityList = [...new Set(fullYearData.map(item => item.municipality.trim()))];
municipalityList = municipalityList.filter(m => m !== 'Södertälje').sort((a, b) => a.localeCompare(b));
municipalityList.unshift('Södertälje');

let selectedMunicipality = addDropdown('Kommun', municipalityList);

let selectedMunicipalityData = fullYearData.filter(item => item.municipality === selectedMunicipality);

let formattedMunicipalityData = makeChartFriendly(selectedMunicipalityData);
formattedMunicipalityData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];

drawGoogleChart({
  type: 'ColumnChart',
  data: formattedMunicipalityData,
  options: {
    title: `Arbetslöshet och valdeltagande i ${selectedMunicipality}, år ${municipalityChartYear} (i procent).`,
    legend: {
      position: 'right',
      alignment: 'start',
      maxLines: 6
    },
    height: 400,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    vAxis: {
      minValue: 0
    },
    colors: ['green', 'orange']
  }
});



let comparisonYear = municipalityChartYear;
let fullDataForYear = unemploymentAndTurnoutByYear[comparisonYear];

let comparisonData = fullDataForYear.filter(item =>
  item.municipality === 'Södertälje' || item.municipality === 'Danderyd'
);

let formattedComparisonData = makeChartFriendly(comparisonData);
formattedComparisonData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];

drawGoogleChart({
  type: 'ColumnChart',
  data: formattedComparisonData,
  options: {
    title: `Arbetslöshet och valdeltagande: Södertälje vs Danderyd (${comparisonYear})`,
    legend: {
      position: 'right',
      alignment: 'start'
    },
    height: 400,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    vAxis: {
      minValue: 0,
      title: 'Procent'
    },
    colors: ['green', 'orange']
  }
});

let fullUnemploymentDataForYear = {
  2018: inPercent2018.map(x => ({
    municipality: x.municipality,
    year: x.year,
    unemployedPercent: x.unemployedPercent,
    turnout: x.turnout
  })),
  2022: inPercent2022.map(x => ({
    municipality: x.municipality,
    year: x.year,
    unemployedPercent: x.unemployedPercent,
    turnout: x.turnout
  }))
};

addMdToPage(`
  <br>

  **Men, om vi ser efter** så blir det tydligt att variationerna är små. Med några få undantag rör sig valdeltagandet förhållandevis stadigt nånstans mellan 80-85 procent, även när vi filtrerar på de kommuner som har lägst eller högst arbetslöshet.

  Våra vänner i Danderyd och Södertälje till trots.
  
  `);

let selectedYear = addDropdown('År', [2022, 2018]);
let selectedGroups = unemploymentGroupsByYear[selectedYear];
let selectedLevelLabel = addDropdown('Arbetslöshet på kommunnivå', selectedGroups.map(g => g.label), 'Medelmåttig');

let selectedGroup = selectedGroups
  .find(g => g.label === selectedLevelLabel);

let unemploymentLevelChart = selectedGroup.data;

let chartData = makeChartFriendly(unemploymentLevelChart);
chartData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];

drawGoogleChart({
  type: 'LineChart',
  data: chartData,
  options: {
    title: `Valdeltagande per kommun år ${selectedYear}. ${selectedLevelLabel} procentuell arbetslöshet.`,
    legend: { position: 'right' },
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    colors: ['green', 'orange'],
    series: {
      0: { lineWidth: 4 },
      1: { lineWidth: 4 }
    },

  }
});

let highestLowestByYear = {
  2018: [
    { label: 'Högst arbetslöshet', data: topTenHighest2018 },
    { label: 'Lägst arbetslöshet', data: topTenLowest2018 }
  ],
  2022: [
    { label: 'Högst arbetslöshet', data: topTenHighest2022 },
    { label: 'Lägst arbetslöshet', data: topTenLowest2022 }

  ]
};

addMdToPage(`
  <br>

  **Låt oss jämföra ** så blir det tydligt att variationerna är små. Med några få undantag rör sig valdeltagandet förhållandevis stadigt nånstans mellan 80-85 procent, även när vi filtrerar på de kommuner som har lägst eller högst arbetslöshet.

  Våra vänner i *Danderyd* och *Södertälje* till trots.
  
  `);

let selectedYear2 = addDropdown('År', [2018, 2022]);

let highestLowestGroups = highestLowestByYear[selectedYear2];
let selectedHighestLowest = addDropdown('De tio kommuner med ', highestLowestGroups.map(g => g.label));
let selectedHighestLowestGroup = highestLowestGroups.find(g => g.label === selectedHighestLowest);
let highestLowestChartData = selectedHighestLowestGroup.data;

let newHighestLowestChartData = makeChartFriendly(highestLowestChartData);
newHighestLowestChartData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];


drawGoogleChart({
  type: 'ColumnChart',
  data: newHighestLowestChartData,
  options: {
    title: `${selectedHighestLowest} bland kommuner, topp tio (${selectedYear2}).`,
    legend: '',
    height: 400,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    colors: ['green', 'orange']
  }
});

addMdToPage(`
  <br>

  **Men, om vi ser efter** så blir det tydligt att variationerna är små. Med några få undantag rör sig valdeltagandet förhållandevis stadigt nånstans mellan 80-85 procent, även när vi filtrerar på de kommuner som har lägst eller högst arbetslöshet.

  Våra vänner i *Danderyd* och *Södertälje* till trots.
  
  `);
