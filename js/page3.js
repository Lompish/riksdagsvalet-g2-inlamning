
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
    { label: 'Medel', data: mediumUnemployment2018 }

  ],
  2022: [
    { label: 'Hög', data: highUnemployment2022 },
    { label: 'Låg', data: lowUnemployment2022 },
    { label: 'Medel', data: mediumUnemployment2022 }
  ]
};
/////

// First Chart: Line chart for all municipalities based on the selected unemployment group
let selectedYear = addDropdown('År', [2018, 2022]);
let selectedGroups = unemploymentGroupsByYear[selectedYear];
let selectedLevelLabel = addDropdown('Arbetslöshet', selectedGroups.map(g => g.label));
let selectedGroup = selectedGroups.find(g => g.label === selectedLevelLabel);
let unemploymentLevelChart = selectedGroup.data;

let chartData = makeChartFriendly(unemploymentLevelChart);
chartData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];

drawGoogleChart({
  type: 'LineChart',
  data: chartData,
  options: {
    title: `Valdeltagande per kommun. Arbetslöshetsgrad: ${selectedLevelLabel}. År ${selectedYear}`,
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
    }
  }
});

// Second Chart: Separate chart for a single municipality
let selectedMunicipality = addDropdown('Välj en kommun', ['Samtliga', ...unemploymentLevelChart.map(item => item.municipality)]); // Use the list of municipalities from the dataset

let selectedMunicipalityData = selectedMunicipality === 'Samtliga'
  ? unemploymentLevelChart
  : unemploymentLevelChart.filter(item => item.municipality === selectedMunicipality);

let formattedMunicipalityData = makeChartFriendly(selectedMunicipalityData);

formattedMunicipalityData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];

drawGoogleChart({
  type: 'ColumnChart',
  data: formattedMunicipalityData,
  options: {
    title: `Arbetslöshet och valdeltagande i ${selectedMunicipality}, år ${selectedYear} (i procent).`,
    legend: {
      position: 'right',
      alignment: 'start',
      maxLines: 3
    },
    height: 400,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    colors: ['green', 'orange']
  }
});

console.log('formattedMunicipalityData', formattedMunicipalityData)


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
// Third Chart: For the top 10 municipalities with the highest/lowest unemployment rates
let selectedYear2 = addDropdown('År', [2018, 2022]);

// Step 2: Dropdown for top 10 group (highest/lowest)
let highestLowestGroups = highestLowestByYear[selectedYear2]; // Get groups based on the selected year
let selectedHighestLowest = addDropdown('De tio kommuner med ', highestLowestGroups.map(g => g.label)); // Dropdown for "highest" or "lowest" unemployment
let selectedHighestLowestGroup = highestLowestGroups.find(g => g.label === selectedHighestLowest); // Find the selected group

// Step 3: Chart data (data for the selected highest/lowest group)
let highestLowestChartData = selectedHighestLowestGroup.data;

let newHighestLowestChartData = makeChartFriendly(highestLowestChartData);
newHighestLowestChartData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];

// Step 4: Draw the third chart
drawGoogleChart({
  type: 'ColumnChart',
  data: newHighestLowestChartData,
  options: {
    title: `${selectedHighestLowest}, topp tio (${selectedYear2}).`, // Title reflects selected year and group (highest/lowest)
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

console.log('newHighestLowestChartData', newHighestLowestChartData)
/////

/*
let selectedYear = addDropdown('År', [2018, 2022]);
let selectedGroups = unemploymentGroupsByYear[selectedYear];
let selectedLevelLabel = addDropdown('Arbetslöshet', selectedGroups.map(g => g.label));
let selectedGroup = selectedGroups.find(g => g.label === selectedLevelLabel);
let unemploymentLevelChart = selectedGroup.data;

let chartData = makeChartFriendly(unemploymentLevelChart);

chartData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];

drawGoogleChart({
  type: 'LineChart',
  data: chartData,
  options: {
    title: `Valdeltagande per kommun. Arbetslöshetsgrad: ${selectedLevelLabel}. År ${selectedYear}`,
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
    }
  }
});
// Second Chart: Separate chart for a single municipality
let selectedMunicipality = addDropdown('Välj en kommun', ['Samtliga', ...unemploymentLevelChart.map(item => item.municipality)]); // Use the list of municipalities from the dataset

let selectedMunicipalityData = selectedMunicipality === 'Samtliga'
  ? unemploymentLevelChart
  : unemploymentLevelChart.filter(item => item.municipality === selectedMunicipality);

let formattedMunicipalityData = makeChartFriendly(selectedMunicipalityData);

formattedMunicipalityData[0] = ['Kommun', 'Arbetslöshet', 'Valdeltagande'];

drawGoogleChart({
  type: 'ColumnChart',
  data: formattedMunicipalityData,
  options: {
    title: `Arbetslöshet och valdeltagande i ${selectedMunicipality} år ${selectedYear} (i procent).`,
    legend: {
      position: 'right',
      alignment: 'start',
      maxLines: 3
    },
    height: 400,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    colors: ['green', 'orange']
  }
});

// Step 1: Dropdown for year
let selectedYear2 = addDropdown('År', [2018, 2022]);

// Step 2: Dropdown for top 10 group (highest/lowest)
let highestLowestGroups = highestLowestByYear[selectedYear2]; // Get groups based on the selected year
let selectedHighestLowest = addDropdown('De tio kommuner med ', highestLowestGroups.map(g => g.label)); // Dropdown for "highest" or "lowest" unemployment
let selectedHighestLowestGroup = highestLowestGroups.find(g => g.label === selectedHighestLowest); // Find the selected group

// Step 3: Chart data (data for the selected highest/lowest group)
let highestLowestChartData = selectedHighestLowestGroup.data;

// Step 4: Draw the third chart
drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(highestLowestChartData),
  options: {
    title: `Topp 10 kommuner (${selectedYear2}) ${selectedHighestLowest}`, // Title reflects selected year and group (highest/lowest)
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


/*
/////
let selectedYear = addDropdown('År', [2018, 2022]);
let selectedGroups = unemploymentGroupsByYear[selectedYear];
let selectedLevelLabel = addDropdown('Arbetslöshet', selectedGroups.map(g => g.label));
let selectedGroup = selectedGroups.find(g => g.label === selectedLevelLabel);
let unemploymentLevelChart = selectedGroup.data;

let municipalityNames = unemploymentLevelChart.map(item => item.municipality);
let selectedMunicipality = addDropdown('Kommun', ['Samtliga', ...municipalityNames]);

let chartData = selectedMunicipality === 'Samtliga'
  ? unemploymentLevelChart
  : unemploymentLevelChart.filter(item => item.municipality === selectedMunicipality);

let newChartData = makeChartFriendly(chartData);


newChartData[0] = ['Kommun', 'Arbetslöshet ', 'Valdeltagande'];

drawGoogleChart({
  type: 'LineChart',
  data: newChartData,
  options: {
    title: `Arbetslöshet och valdeltagande per kommun (${selectedYear}) ${selectedLevelLabel}${selectedMunicipality !== 'Alla' ? ', ' + selectedMunicipality : ''}`,
    legend: {
      position: 'right'
    },
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
    }
  }
});

let highestLowestByYear = {
  2018: [
    { label: 'lägst arbetslöshet', data: topTenLowest2018 },
    { label: 'högst arbetslöshet', data: topTenHighest2018 }
  ],
  2022: [
    { label: 'lägst arbetslöshet', data: topTenLowest2022 },
    { label: 'högst arbetslöshet', data: topTenHighest2022 }
  ]
};


let newSelectedYear = addDropdown('År', [2018, 2022]);

let highestLowestGroups = highestLowestByYear[newSelectedYear];
let selectedHighestLowest = addDropdown('De tio kommuner med ', highestLowestGroups.map(g => g.label));
let selectedHighestLowestGroup = highestLowestGroups.find(g => g.label === selectedHighestLowest);

let highestLowestChartData = selectedHighestLowestGroup.data;

let formattedChartData = makeChartFriendly(highestLowestChartData);

let unemployedLabel = `Arbetslöshet`;
let turnoutLabel = 'Valdeltagande';

formattedChartData[0] = ['Kommun', unemployedLabel, turnoutLabel];

drawGoogleChart({
  type: 'ColumnChart',
  data: formattedChartData,
  options: {
    title: `De 10 kommuner med ${selectedHighestLowest} (${newSelectedYear}) `,
    legend: {
      position: 'right',
      alignment: 'start',
      maxLines: 3
    },
    height: 400,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    },
    colors: ['green', 'orange']
  }
});

//////////

// Step 1: Dropdown for year
let selectedYear2 = addDropdown('År', [2018, 2022]);

// Step 2: Dropdown for top 10 group
let highestLowestGroups = highestLowestByYear[selectedYear2];
let selectedHighestLowest = addDropdown('De tio kommuner med ', highestLowestGroups.map(g => g.label));
let selectedHighestLowestGroup = highestLowestGroups.find(g => g.label === selectedHighestLowest);

// Step 3: Chart data
let highestLowestChartData = selectedHighestLowestGroup.data;

// Step 4: Draw the second chart
drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(highestLowestChartData),
  options: {
    title: `Topp 10 kommuner (${selectedYear2}) ${selectedHighestLowest}`,
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

*/