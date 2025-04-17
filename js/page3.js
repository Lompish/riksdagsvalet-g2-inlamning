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

let counties = await dbQuery(`
  SELECT DISTINCT municipality
  AS 'Kommun'
  FROM eligibleVotersAge
  `);
tableFromData({ data: counties });


