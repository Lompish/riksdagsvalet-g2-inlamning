
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
  votersPercent2018 AS 'turnout2018'
FROM eligibleVotersAge
WHERE age = 'samtliga åldrar'
GROUP BY municipality
`);

let turnout2022 = await dbQuery(`
SELECT 
  municipality, 
  votersPercent2022 AS 'turnout2022'
FROM eligibleVotersAge
WHERE age = 'samtliga åldrar'
GROUP BY municipality
`);

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

console.log('popul', population2018And2022[0])


let inPercent = unemployed2018And2022.map(x => ({ ...x, population: population2018And2022.find(y => x.year == y.year && x.municipality == y.municipality) }).population)

console.log('inPercent', inPercent[0])

/*
SELECT 
  municipality, 
  SUM(population2018) AS population2018, 
  SUM(population2022) AS population2022
FROM population
WHERE age BETWEEN 18 AND 100
GROUP BY municipality
ORDER BY municipality;
*/

