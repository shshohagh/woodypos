/**
 * @license
 * Wood Trading POS System
 * Developer: Rameez Scripts
 * Version: 1.0.0
 * Date: April 2026
 * Description: Google Apps Script Backend for Wood Trading.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Woody POS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// --- SETUP ---
function setupDemoData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['Users', 'Categories', 'Sub_Categories', 'Suppliers', 'Customers', 'Wood_Stocks', 'Purchases', 'Sales', 'Expenses', 'Settings'];
  
  sheets.forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });
  
  // Seed basic data logic here...
  Logger.log("Demo data setup complete.");
}

// --- AUTH ---
function login(email, password) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const data = getSheetData('Users');
    const user = data.find(r => r.email === email && r.password === password);
    if (user) {
      delete user.password;
      return { success: true, user };
    }
    return { success: false, message: 'Invalid credentials' };
  } finally {
    lock.releaseLock();
  }
}

// --- HELPERS ---
function getSheetData(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function processSale(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    // Write Sale logic...
    return { success: true, saleId: 'S-' + Date.now() };
  } finally {
    lock.releaseLock();
  }
}
