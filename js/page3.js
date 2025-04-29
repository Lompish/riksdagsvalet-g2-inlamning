
addMdToPage(`

## Valdeltagande i relation till arbetslöshet.  

<br>

* Är valdeltagandet lägre i kommuner med hög arbetslöshet?

* Är valdeltagandet högre i kommuner med lägre arbetslöshet?

<br>

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

console.log('unemployed2018And2022', unemployed2018And2022[0])

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

/*
let combinedTurnout = await dbQuery(`
SELECT 
  municipality, 
  votersPercent2018 AS turnout2018, 
  votersPercent2022 AS turnout2022
FROM eligibleVotersAge
WHERE age = 'samtliga åldrar'
GROUP BY municipality
ORDER BY municipality;
`);
*/
console.log('turnout', turnout2022)
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
console.log('inPercent2018', inPercent2018);

inPercent2022.sort((a, b) => a.unemployedPercent > b.unemployedPercent ? 1 : -1)

let unemployment2018 = inPercent2018.map(x => x.unemployedPercent)

let lowUnemployment2018 = inPercent2018.slice(0, 96)
let mediumUnemployment2018 = inPercent2018.slice(96, 192)
let highUnemployment2018 = inPercent2018.slice(192)

let lowUnemployment2022 = inPercent2022.slice(0, 96)
let mediumUnemployment2022 = inPercent2022.slice(96, 192)
let highUnemployment2022 = inPercent2022.slice(192)

console.log(lowUnemployment2018)
console.log(mediumUnemployment2018)
console.log(highUnemployment2018)

let unemploymentGroups = [
  { label: 'lowUnemployment2018', data: lowUnemployment2018 },
  { label: 'mediumUnemployment2018', data: mediumUnemployment2018 },
  { label: 'highUnemployment2018', data: highUnemployment2018 }
]

let unemplymentGroups2022 = [
  { label: 'lowUnemployment2022', data: lowUnemployment2022 },
  { label: 'mediumUnemployment2022', data: mediumUnemployment2022 },
  { label: 'highUnemployment2022', data: highUnemployment2022 }
]

let unemploymentGroupsByYear = {
  2018: [
    { label: 'Låg arbetslöshetsnivå', data: lowUnemployment2018 },
    { label: 'Medel arbetslöshetsnivå', data: mediumUnemployment2018 },
    { label: 'Hög arbetslöshetsnivå', data: highUnemployment2018 }
  ],
  2022: [
    { label: 'Låg arbetslöshetsnivå', data: lowUnemployment2022 },
    { label: 'Medel arbetslöshetsnivå', data: mediumUnemployment2022 },
    { label: 'Hög arbetslöshetsnivå', data: highUnemployment2022 }
  ]
};
////Existing: Select year and unemployment group
let selectedYear = addDropdown('År', [2018, 2022]);
let selectedGroups = unemploymentGroupsByYear[selectedYear];
let selectedLevelLabel = addDropdown('Arbetslöshet', selectedGroups.map(g => g.label));
let selectedGroup = selectedGroups.find(g => g.label === selectedLevelLabel);
let unemploymentLevelChart = selectedGroup.data;

// 👇 NEW: Add dropdown for municipality
let municipalityNames = unemploymentLevelChart.map(item => item.municipality); // note: it's `municipality`, not `kommun`
let selectedMunicipality = addDropdown('Kommun', ['Alla', ...municipalityNames]); // Add 'Alla' as default

// 👇 Filter chart data based on municipality selection
let chartData = selectedMunicipality === 'Alla'
  ? unemploymentLevelChart
  : unemploymentLevelChart.filter(item => item.municipality === selectedMunicipality);

// Draw the chart
drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(chartData),
  options: {
    title: `Arbetslöshet och valdeltagande per kommun (${selectedYear}) – ${selectedLevelLabel}${selectedMunicipality !== 'Alla' ? ', ' + selectedMunicipality : ''}`,
    legend: '',
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    colors: ['#3366cc', '#dc3912']
  }
});
//////

/*

let selectedYear = addDropdown('År', [2018, 2022]);

let selectedGroups = unemploymentGroupsByYear[selectedYear];

let selectedLevelLabel = addDropdown('Arbetslöshet', selectedGroups.map(g => g.label));

let selectedGroup = selectedGroups.find(g => g.label === selectedLevelLabel);

let unemploymentLevelChart = selectedGroup.data;


drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(unemploymentLevelChart),
  options: {
    title: `Arbetslöshet och valdeltagande per kommun (${selectedYear}), (${selectedLevelLabel}).`,
    legend: '',
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    }
  }
});





/////////




/*
// Extract available municipalities from current dataset
let municipalityNames = unemploymentLevelChart.map(item => item.kommun);

// Add a dropdown for selecting a single municipality
let selectedMunicipality = addDropdown('Kommun', municipalityNames);

let selectedData = unemploymentLevelChart.find(item => item.kommun === selectedMunicipality);

console.log('unemploymentLevelChart', unemploymentLevelChart[0])

drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(unemploymentLevelChart),
  options: {
    title: 'nånting',
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    }
  }
});


SELECT 
  municipality, 
  SUM(population2018) AS population2018, 
  SUM(population2022) AS population2022
FROM population
WHERE age BETWEEN 18 AND 100
GROUP BY municipality
ORDER BY municipality;


let inPercent = unemployed2018And2022
  .map(x => {
    let matchingPop = population2018And2022
      .find(y => x.year == y.year && x.municipality == y.municipality);

    if (matchingPop && matchingPop.population) {
      return {
        ...x,
        unemploymentPercent: ((x.unemployed / matchingPop.population) * 100).toFixed(2)
      };
    } else {
      return {
        ...x,
        unemploymentPercent: null
      };
    }
  });
*/

