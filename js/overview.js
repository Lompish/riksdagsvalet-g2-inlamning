import './libs/liveReload.js';
import addMdToPage from './libs/addMdToPage.js';
import tableFromData from './libs/tableFromData.js'
import addDropdown from './libs/addDropdown.js';
import drawGoogleChart from './libs/drawGoogleChart.js';
import makeChartFriendly from './libs/makeChartFriendly.js';
import * as vars from './commonVars.js';

addMdToPage(`
## Här står det grejer
Olika typer av saker
<br>
<br>
`);

// Data overview, first five rows

tableFromData({ data: vars.data });

// Total respondents

tableFromData({ data: vars.totalRespondents });

// Total respondents with depression

tableFromData({ data: vars.totalDepression });

// Total male respondents with depression

tableFromData({ data: vars.totalDepressionMen });

// Total female respondents with depression

tableFromData({ data: vars.totalDepressionWomen });

let genderDepression = [
  vars.totalDepressionMen[0],
  vars.totalDepressionWomen[0]
]

//chartDataGenderDepression = genderDepression.map({ gender, count }), ({ gender, count })

const chartDataGenderDepression = [
  ...genderDepression.map(({ gender, count }) => [gender, Number(count)])
];



drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(chartDataGenderDepression),
  options: {
    title: 'Nånting',
    height: 500,
    chartArea: { left: 80 },
    hAxis: {
      slantedText: true,
      slantedAngle: 45
    }
  }
});

/*

console.log("lajsbdlajsbdlkasbdl")
console.log("Test - ", vars.totalDepressionWomen)
console.log("Test - ", vars.totalDepressionWomen[0]["Antal kvinnor som uppger depression"])

  */