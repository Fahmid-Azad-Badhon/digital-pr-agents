const MuckRackCollector = require(""./collectors/muckrack-collector"");
(async () => {
  try {
    const result = await MuckRackCollector.runCollection(""personal finance"", 5, { port: 9333, debug: false });
    console.log(JSON.stringify({ ok: true, count: result.count, sample: result.journalists.slice(0,3).map(j => ({name:j.name, outlet:j.outlet})) }, null, 2));
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e.message }, null, 2));
    process.exit(1);
  }
})();
