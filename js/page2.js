addMdToPage(`
  ## Hypotes Två: 
  I de kommuner där inkomstökningen varit låg eller negativ har partierna i opposition(S, V, Mp och C) behållit eller ökat sitt stöd.

  Vad är medelinkomsten i alla kommuner? 

  I den här hypotesen har vi två aspekter att ha i åtanke: Ska vi jämföra de top 10 kommunerna vars medelinkomst har ökat minst mellan 2018 och 2022 eller hitta den kommuner som tjänar minst och se hur mycket deras medelinkomst har ökat? Samt därefter se om partistödet har ökat för de partier som är i opposition.
  
  ### Plan A: 

  Steg 1: Hitta de kommuner där inkomsten har ökat som minst mellan år 2018 och 2022. Håller oss till top 10.

  Steg 2: Jämför med partistödet i dessa kommuner. Har de partier som är i opposition bibehållit sitt stöd?

  Steg 3: Rita ut det i ett stapeldiagram där vi ser hur mycket partierna ökat sitt stöd i dessa kommuner.


  ### Plan B:

  Steg 1: Hitta de kommuner som tjänar minst under båda årtalen och se hur mycket deras medelinkomst har ökat. 

  Steg 2: Jämför med partistödet i dessa kommuner. Har de partier som är i opposition bibehållit sitt stöd?

  Steg 3: Rita ut det i ett stapeldiagram där vi ser hur mycket partierna ökat sitt stöd i dessa kommuner.
`);

// steg 1
//Vad är medelinkomsten i alla kommuner under 2018 och 2022?

dbQuery.use('kommun-info-mongodb');

let kommuner18 = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

let meanIncomes18 = kommuner18.map(x => ({
  kommun: x.kommun,
  medelInkomst2018: x.medelInkomst2018
}));

meanIncomes18 = meanIncomes18.filter(x => x.medelInkomst2018 != null);

meanIncomes18.sort((a, b) => b.medelInkomst2018 - a.medelInkomst2018);

drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(meanIncomes18, 'Kommun', 'MedelInkomst2018'),
  options: {
    title: 'Medelinkomst 2018 i alla kommuner (TSEK)',
    height: 600,
    chartArea: { left: 50, bottom: 150 },
    vAxis: { title: 'Inkomst (TSEK)' },
    hAxis: {
      slantedText: true,
      slantedTextAngle: 45
    }
  }
});


addMdToPage(`
  <br/>`)


let kommuner = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

let meanIncomes = kommuner.map(x => ({
  kommun: x.kommun,
  medelInkomst2022: x.medelInkomst2022
}));

meanIncomes = meanIncomes.filter(x => x.medelInkomst2022 != null);

meanIncomes.sort((a, b) => b.medelInkomst2022 - a.medelInkomst2022);

drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(meanIncomes, 'kommun', 'medelInkomst2022'),
  options: {
    title: 'Medelinkomst 2022 i alla kommuner (TSEK)',
    height: 600,
    chartArea: { left: 50, bottom: 150 },
    vAxis: { title: 'Inkomst (TSEK)' },
    hAxis: {
      slantedText: true,
      slantedTextAngle: 45
    }
  }
});

addMdToPage(`
  <br/>`)


let kommunerTotalt = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })
  .toArray();

let meanIncomesTotalt = kommuner
  .filter(x => x.medelInkomst2018 != null && x.medelInkomst2022 != null)
  .map(x => ({
    kommun: x.kommun,
    medelInkomst2018: x.medelInkomst2018,
    medelInkomst2022: x.medelInkomst2022
  }));


meanIncomesTotalt.sort((a, b) => b.medelInkomst2022 - a.medelInkomst2022);

drawGoogleChart({
  type: 'ColumnChart',
  data: [
    ['Kommun', '2018', '2022'],
    ...meanIncomesTotalt.map(x => [x.kommun, x.medelInkomst2018, x.medelInkomst2022])
  ],
  options: {
    title: 'Medelinkomst per kommun: 2018 vs 2022',
    height: 600,
    chartArea: { left: 50, bottom: 150 },
    vAxis: { title: 'Inkomst (TSEK)', minValue: 0 },
    hAxis: { slantedText: true, slantedTextAngle: 45 },
    seriesType: 'bars',
    isStacked: false
  }
});


addMdToPage(`
  <br/>`)


let kommunerTop10 = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

let meanIncomesTop10 = kommunerTop10
  .filter(x => x.medelInkomst2018 != null)
  .map(x => ({
    kommun: x.kommun,
    medelInkomst2018: x.medelInkomst2018
  }));

meanIncomesTop10.sort((a, b) => a.medelInkomst2018 - b.medelInkomst2018);

let bottom10 = meanIncomesTop10.slice(0, 10);

tableFromData({
  data: bottom10,
  columnNames: ['Kommun', 'Medelinkomst 2018 (TSEK)']
});


addMdToPage(`
  <br/>`)

let kommunerTop102022 = await dbQuery.collection('incomeByKommun')
  .find({ kon: 'totalt' })

let meanIncomesTop102022 = kommunerTop102022
  .filter(x => x.medelInkomst2018 != null)
  .map(x => ({
    kommun: x.kommun,
    medelInkomst2022: x.medelInkomst2022
  }));

meanIncomesTop102022.sort((a, b) => a.medelInkomst2022 - b.medelInkomst2022);

let bottom102022 = meanIncomesTop102022.slice(0, 10);

tableFromData({
  data: bottom102022,
  columnNames: ['Kommun', 'Medelinkomst 2022 (TSEK)']
});
