/**
 * MIS Tools — Revenue, Billing & Collections MIS
 * Adds a "MIS Tools" menu that:
 *   1. Highlights invoices 90+ days overdue in the Working sheet
 *   2. Counts failed test cases in Test_Cases
 *   3. Saves a dated KPI snapshot to the Monthly_Log sheet
 *   4. Shows a short summary pop-up
 */

// Runs automatically when the spreadsheet opens: adds the custom menu
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('MIS Tools')
    .addItem('Run monthly MIS check', 'runMonthlyCheck')
    .addToUi();
}

function runMonthlyCheck() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const working = ss.getSheetByName('Working');
  const kpi = ss.getSheetByName('KPI');
  const tests = ss.getSheetByName('Test_Cases');
  const asOf = ss.getSheetByName('Control').getRange('B1').getValue();

  // 1. Highlight invoices 90+ days overdue (Ageing_Bucket is column L = 12)
  const lastRow = working.getLastRow();
  const buckets = working.getRange(2, 12, lastRow - 1, 1).getValues();
  const colours = buckets.map(r => Array(12).fill(r[0] === '90+' ? '#f4cccc' : null));
  working.getRange(2, 1, lastRow - 1, 12).setBackgrounds(colours);
  const count90 = buckets.filter(r => r[0] === '90+').length;

  // 2. Count failed test cases (Status is column E)
  const status = tests.getRange('E2:E13').getValues();
  const fails = status.filter(r => r[0] === 'FAIL').length;

  // 3. Save a KPI snapshot to Monthly_Log (creates the sheet the first time)
  let log = ss.getSheetByName('Monthly_Log');
  if (!log) {
    log = ss.insertSheet('Monthly_Log');
    log.appendRow(['Run Time', 'As-Of Date', 'Total Billed', 'Total Collected',
                   'Total Outstanding', 'DSO (days)', '90+ Amount',
                   'Invoices 90+', 'Tests Failed']);
  }
  log.appendRow([
    new Date(),
    asOf,
    kpi.getRange('B1').getValue(),
    kpi.getRange('B2').getValue(),
    kpi.getRange('B3').getValue(),
    Math.round(kpi.getRange('B7').getValue()),
    kpi.getRange('B5').getValue(),
    count90,
    fails
  ]);

  // 4. Summary pop-up
  SpreadsheetApp.getUi().alert(
    'MIS check done:\n' +
    count90 + ' invoices are 90+ days overdue (highlighted in Working).\n' +
    fails + ' of 12 tests failed (see Bug_Log).\n' +
    'Snapshot saved to Monthly_Log.'
  );
}
