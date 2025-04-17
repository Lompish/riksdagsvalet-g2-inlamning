import tableFromData from './libs/tableFromData.js'
import addDropdown from './libs/addDropdown.js';
import drawGoogleChart from './libs/drawGoogleChart.js';
import makeChartFriendly from './libs/makeChartFriendly.js';
import * as vars from './commonVars.js';

addMdToPage(`
Här står det bara lite olika saker
`);

tableFromData({ data: vars.municipalities });