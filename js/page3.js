
addMdToPage(`

## Valdeltagande i relation till arbetslöshet.  

<br>

* Är valdeltagandet lägre i kommuner med hög arbetslöshet?

* Är valdeltagandet högre i kommuner med lägre arbetslöshet?

<br>

`);

dbQuery.use('population-sqlite');

let population2018And2022 = await dbQuery(`
SELECT 
  municipality, 
  '2018' AS year, 
  SUM(population2018) AS population
FROM population
WHERE age >= 18 AND age <= 100
  AND municipality = 'Stockholm'
GROUP BY municipality

UNION ALL

SELECT 
  municipality, 
  '2022' AS year, 
  SUM(population2022) AS population
FROM population
WHERE age >= 18 AND age <= 100
  AND municipality = 'Stockholm'
GROUP BY municipality;
`);

tableFromData({
  data: population2018And2022.slice(0, 5),
  //columnNames: ['Kommun', 'Folkmängd 2018', 'Folkmängd 2022']
});

let population2018 = population2018And2022
  .filter(x => x.year == '2018')
  .map(({ municipality, population }) => ({ municipality, population }));

let population2022 = population2018And2022
  .filter(x => x.year == '2022')
  .map(({ municipality, population }) => ({ municipality, population }));


let totalpopulation = population2018And2022
  .map(x => ({ municipality: x.municipality, population2018: x.population }))
  .map(x => ({ ...x, population2022: population2022.find(y => y.municipality == x.municipality).population }));

let populationForChart;
let populationYear = addDropdown('År', [2018, 2022, 'Samtliga']);
if (populationYear == 2018) {
  populationForChart = population2018;
}
else if (populationYear == 2022) {
  populationForChart = population2022;
}
else if (populationYear == 'Samtliga') {
  populationForChart = totalUnemployed;
}

/*
drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(populationForChart),
  options: {
    title: 'Folkmängd åldrar 18-64 år, per kommun ' + populationYear,
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    }
  }
});
*/


/*
console.log('2018', population2018)
console.log('2022', population2022)
console.log('total', totalpopulation)




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


let unemployedForChart;
let year = addDropdown('År', [2018, 2022, 'Samtliga']);
if (year == 2018) {
  unemployedForChart = unemployed2018;
}
else if (year == 2022) {
  unemployedForChart = unemployed2022;
}
else if (year == 'Samtliga') {
  unemployedForChart = totalUnemployed;
}


drawGoogleChart({
  type: 'ScatterChart',
  data: makeChartFriendly(unemployedForChart),
  options: {
    title: 'Antal arbetslösa per kommun ' + year,
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    }
  }
});

/*

dbQuery.use('unemployed-sqlite');

let unemployed2018 = await dbQuery(`
SELECT 
  municipality, 
  ROUND(AVG(unemployedTotal)) AS unemployed, 
  '2018' AS period
FROM unemployed
WHERE period LIKE '2018%'
GROUP BY municipality;
`);

tableFromData({
  data: unemployed2018.slice(0, 5),
  columnNames: ['Kommun', 'Antal arbetslösa (genomsnitt/år)', 'Period']
});

dbQuery.use('unemployed-sqlite');

let unemployed2022 = await dbQuery(`
SELECT 
  municipality, 
  ROUND(AVG(unemployedTotal)) AS unemployed, 
  '2022' AS period
FROM unemployed
WHERE period LIKE '2022%'
GROUP BY municipality;
`);

tableFromData({
  data: unemployed2022.slice(0, 5),
  columnNames: ['Kommun', 'Antal arbetslösa (genomsnitt/år)', 'Period']
});

let unemployed2018And2022 = await dbQuery(`
SELECT 
  municipality, 
  ROUND(AVG(unemployedTotal)) AS unemployed, 
  SUBSTRING(period,1,4) AS year
FROM unemployed
GROUP BY municipality, year;
`);

// convert data so that we have both unemployed data columns in one row
let only2018 = unemployed2018And2022.filter(x => x.year == '2018');
let only2022 = unemployed2018And2022.filter(x => x.year == '2022');
unemployed2018And2022 = only2018
  .map(x => ({ municipality: x.municipality, unemployed2018: x.unemployed }))
  .map(x => ({ ...x, unemployed2022: only2022.find(y => y.municipality == x.municipality).unemployed }));

tableFromData({
  data: unemployed2018And2022.slice(0, 5),
  columnNames: ['Kommun', 'Antal arbetslösa (genomsnitt/period)', 'Period']
});


let totalEligibleVotersMunicipality2018And2022 = totalEligibleVotersMunicipality2018.map(
  (x, i) => ({ ...x, eligibleVoters2022: totalEligibleVotersMunicipality2022[i].eligibleVoters2022 }));
console.log('totalEligibleVotersMunicipality2018And2022', totalEligibleVotersMunicipality2018And2022);


let dataToShowUnemployed;
let yearUnemployed = addDropdown('År', [2018, 2022, 'Båda']);
if (yearUnemployed == 2018) {
  dataToShowUnemployed = unemployed2018;
}
else if (yearUnemployed == 2022) {
  dataToShowUnemployed = unemployed2022;
}
else {
  dataToShowUnemployed = unemployed2018And2022;
}


//console.log("THE THANG WE SHOW IN DA DIAGRAM", [...new Set(dataToShowUnemployed.map(x => typeof x.municipality))])

console.log("AHGAIN", dataToShowUnemployed)
dataToShowUnemployed.forEach(x => delete x.period);

drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(dataToShowUnemployed),
  options: {
    title: 'Antal arbetslösa per kommun ' + yearUnemployed,
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    }
  }
});

dbQuery.use('eligibleVotersAge-sqlite');

let totalEligibleVotersMunicipality2018 = await dbQuery(`
SELECT municipality, eligibleVoters2018
FROM eligibleVotersAge
WHERE age = 'samtliga åldrar' AND gender = 'totalt'
GROUP BY municipality
LIMIT 5;
`);
tableFromData({
  data: totalEligibleVotersMunicipality2018.slice(0, 5),
  columnNames: ['Kommun', 'Totalt antal röstberättigade 2018'],
});

let totalEligibleVotersMunicipality2022 = await dbQuery(`
SELECT DISTINCT municipality, eligibleVoters2022
FROM eligibleVotersAge
WHERE age = 'samtliga åldrar' AND gender = 'totalt'
GROUP BY municipality
LIMIT 5;
`);
tableFromData({
  data: totalEligibleVotersMunicipality2022.slice(0, 5),
  columnNames: ['Kommun', 'Totalt antal röstberättigade 2022'],
});

console.log('totalEligibleVotersMunicipality2018', totalEligibleVotersMunicipality2018);
console.log('totalEligibleVotersMunicipality2022', totalEligibleVotersMunicipality2022);

// The equivalent of SELECT DISTINCT municipality, eligibleVoters2018, eligibleVoters2022
let totalEligibleVotersMunicipality2018And2022 = totalEligibleVotersMunicipality2018.map(
  (x, i) => ({ ...x, eligibleVoters2022: totalEligibleVotersMunicipality2022[i].eligibleVoters2022 }));
console.log('totalEligibleVotersMunicipality2018And2022', totalEligibleVotersMunicipality2018And2022);

let dataToShowVoters;
let year = addDropdown('År', [2018, 2022, 'Båda']);
if (year == 2018) {
  dataToShowVoters = totalEligibleVotersMunicipality2018;
}
else if (year == 2022) {
  dataToShowVoters = totalEligibleVotersMunicipality2022;
}
else {
  dataToShowVoters = totalEligibleVotersMunicipality2018And2022;
}

drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(dataToShowVoters),
  options: {
    title: 'Antal röstberättigade per kommun',
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    }
  }
});

drawGoogleChart({
  type: 'LineChart',
  data: makeChartFriendly(temperatures2024, 'Månad', 'Temperatur (°C)'),
  options: {
    title: 'Medeltemperaturer i Stockholm 2024, månad för månad',
    height: 500,
    curveType: 'function',
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    }
  }
});

dbQuery.use('unemployed-sqlite');

let totalUnemployedMunicipalityPeriod = await dbQuery(`
 SELECT 
  municipality,
  SUBSTRING(period, 1, 4) AS year,
  ROUND(AVG(unemployedTotal)) AS average_unemployed
FROM unemployed
WHERE (period LIKE '2018%' OR period LIKE '2022%')
GROUP BY municipality, SUBSTRING(period, 1, 4)
ORDER BY municipality, year;
  `);
tableFromData({
  data: totalUnemployedMunicipalityPeriod.slice(0, 5),
  columnNames: ['Kommun', 'Period', 'Arbetslösa'],
});
*/
