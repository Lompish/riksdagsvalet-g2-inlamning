import tableFromData from './libs/tableFromData.js'
import addDropdown from './libs/addDropdown.js';
import drawGoogleChart from './libs/drawGoogleChart.js';
import makeChartFriendly from './libs/makeChartFriendly.js';

addMdToPage(`

## Valdeltagande i relation till arbetslöshet.  

<br>

* Är valdeltagandet lägre i kommuner med hög arbetslöshet?

* Är valdeltagandet högre i kommuner med lägre arbetslöshet?

<br>

`);

dbQuery.use('eligibleVotersAge-sqlite');

let totalEligibleVotersMunicipality2018 = await dbQuery(`
SELECT municipality, age, eligibleVoters2018, eligibleVoters2022
FROM eligibleVotersAge
WHERE age = 'samtliga åldrar'
GROUP BY municipality;
`);
tableFromData({
  data: totalEligibleVotersMunicipality2018.slice(0, 5),
  columnNames: ['Kommun', 'Ålderskategori', 'Totalt antal röstberättigade 2018', 'Totalt antal röstberättigade 2022'],
});

dbQuery.use('unemployed-sqlite');

let unemployedPerMunicipalityAge2018 = await dbQuery(`
  SELECT * FROM unemployed;
  `);
tableFromData({
  data: unemployedPerMunicipalityAge2018.slice(0, 5),
  columnNames: ['Kommun', 'År', 'Arbetslösa'],
});

