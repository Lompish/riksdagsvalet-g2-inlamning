import dbQuery from "./libs/dbQuery.js";

dbQuery.use('eligibleVotersAge-sqlite');

const municipalitiesPromise =

  (await dbQuery(`
    SELECT DISTINCT municipality 
    FROM eligibleVotersAge
    `))

export const municipalities = await municipalitiesPromise;


