//Skapa en ny fil, du kan t.ex.kalla den common - vars.js, i den lägger du in olika variabler du vill kunna komma åt i flera andra filer, med nyckelordet export framför.Ett exempel på hur detta kan se ut:

import dbQuery from "./libs/dbQuery.js";

//Data overview, limit 5

const dataPromise = dbQuery(`
  SELECT * FROM studentSurvey
  LIMIT 5
`);

//Number of respondents

const totalRespondentsPromise = dbQuery(`
  SELECT COUNT(*) AS 'count'
  FROM studentSurvey
`);

//Total number of people with depression

const totalDepressionPromise = dbQuery(`
  SELECT depression, COUNT(*) 
  AS 'count'
  FROM studentSurvey
  WHERE depression = 1
`);

//Number of men with depression

const totalDepressionMenPromise = dbQuery(`
  SELECT depression, gender, COUNT(*) 
  AS 'count'
  FROM studentSurvey
  WHERE depression = 1 AND gender = 'Male'
`);


//Number of women with depression

const totalDepressionWomenPromise = dbQuery(`
  SELECT depression, gender, COUNT(*) 
  AS 'count'
  FROM studentSurvey
  WHERE depression = 1 AND gender = 'Female'
`);

export const data = await dataPromise;
export const totalRespondents = await totalRespondentsPromise;
export const totalDepression = await totalDepressionPromise;
export const totalDepressionMen = await totalDepressionMenPromise;
export const totalDepressionWomen = await totalDepressionWomenPromise;


/*

export let optionsForLineChart = {
  height: 500,
  width: 1250,
  chartArea: { left: 50 },
  curveType: 'function',
  pointSize: 5,
  pointShape: 'circle',
  vAxis: { format: '# °C' }
} 
*/