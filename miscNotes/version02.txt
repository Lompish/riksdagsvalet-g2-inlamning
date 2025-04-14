import makeChartFriendly from './libs/makeChartFriendly.js'; './libs/makeChartFriendly.js';
import csvLoad from './libs/csvLoad.js';
import tableFromData from './libs/tableFromData.js';
import drawGoogleChart from './libs/drawGoogleChart.js';
import addToPage from './libs/addToPage.js';

let data = await csvLoad('smhi-rainfall-temperature-sthm.csv', ';');

// Filter: Data from the year 2024
let data2024 = data.filter(x => x.date >= '2024-01' && x.date <= '2024-12');

// Display a headline
addToPage('<h2>Nederbörd och temperaturer i Stockholm,<br>månad för månad 2024</h2>');

// Display a table with the data from the data2024 variable
tableFromData({ data: data2024, columnNames: ['Datum', 'Nederbörd (mm)', 'Temperatur (°C)'] });

// Map: Keep date and temperatureC properties/columns (and not the rainFall column)
let temperatures2024 = data2024.map(({ date, temperatureC }) => ({ date, temperatureC }));

// Draw a line chart of temperatures2024
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

// Can you make a chart that shows rainfall during 2024 here?