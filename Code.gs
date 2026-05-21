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

// --- DATABASE & SEED MODULE (Server.DB & Server.Seed) ---
var Server = Server || {};

Server.DB = {
  getHeaders: function(sheetName) {
    var schemas = {
      "Users": ["id", "name", "email", "phone", "password", "role", "avatar_drive_id", "is_active", "created_at", "updated_at", "otp", "otp_expires"],
      "Categories": ["id", "name", "created_at"],
      "Sub_Categories": ["id", "name", "cat_id", "supplier_id", "date", "created_at"],
      "Suppliers": ["id", "name", "contact_person", "phone", "email", "address", "created_at"],
      "Customers": ["id", "name", "phone", "email", "address", "credit_limit", "created_at"],
      "Wood_Stocks": ["serial", "sub_cat", "purchase_id", "width", "length", "cft", "buy_rate", "sell_rate", "qty", "status", "image_drive_id", "created_at"],
      "Purchases": ["id", "supplier_id", "car_id", "total_amount", "paid_amount", "status", "created_at"],
      "Sales": ["id", "customer_id", "total_amount", "discount", "net_amount", "paid_amount", "status", "payment_method", "created_at", "created_by"],
      "Sale_Items": ["id", "sale_id", "serial", "width", "length", "cft", "rate", "amount"],
      "Payments": ["id", "transaction_type", "party_type", "party_id", "reference_id", "amount", "payment_method", "notes", "created_at"],
      "Expenses": ["id", "title", "category", "amount", "date", "notes", "created_at"],
      "Settings": ["key", "value"],
      "Activity_Logs": ["id", "user_id", "action", "details", "timestamp"]
    };
    return schemas[sheetName] || [];
  },

  initSheets: function() {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheets = ["Users", "Categories", "Sub_Categories", "Suppliers", "Customers", "Wood_Stocks", "Purchases", "Sales", "Sale_Items", "Payments", "Expenses", "Settings", "Activity_Logs"];
    
    sheets.forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
      }
      var range = sheet.getDataRange();
      if (range.isBlank() || range.getLastRow() === 0) {
        var headers = Server.DB.getHeaders(name);
        if (headers.length > 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1d2d50").setFontColor("#64ffda");
        }
      }
    });
  },

  getTable: function(sheetName) {
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];
      
      var headers = data[0];
      var list = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var item = {};
        headers.forEach(function(h, idx) {
          item[h] = row[idx];
        });
        list.push(item);
      }
      return list;
    } catch (e) {
      Logger.log("Error in getTable " + sheetName + ": " + e.toString());
      return [];
    }
  },

  insertRow: function(sheetName, item) {
    return this.insertRows(sheetName, [item]);
  },

  insertRows: function(sheetName, items) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return { success: false, message: "Lock acquisition timeout. Please retry." };
    }
    
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return { success: false, message: "Table not found: " + sheetName };
      
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var rowsToInsert = items.map(function(item) {
        var row = [];
        headers.forEach(function(h) {
          row.push(item[h] !== undefined ? item[h] : "");
        });
        return row;
      });
      
      var startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
      return { success: true };
    } catch (err) {
      return { success: false, message: "Insert error: " + err.toString() };
    } finally {
      lock.releaseLock();
    }
  },

  updateRow: function(sheetName, keyCol, keyVal, updatedFields) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return { success: false, message: "Lock acquisition timeout." };
    }
    
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return { success: false, message: "Table not found: " + sheetName };
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var keyIdx = headers.indexOf(keyCol);
      if (keyIdx === -1) return { success: false, message: "Key column not found." };
      
      var foundRowIndex = -1;
      for (var i = 1; i < data.length; i++) {
        if (data[i][keyIdx].toString() === keyVal.toString()) {
          foundRowIndex = i + 1;
          break;
        }
      }
      
      if (foundRowIndex === -1) {
        return { success: false, message: "Record not found for key: " + keyVal };
      }
      
      for (var k in updatedFields) {
        var colIdx = headers.indexOf(k);
        if (colIdx !== -1) {
          sheet.getRange(foundRowIndex, colIdx + 1).setValue(updatedFields[k]);
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, message: "Update failed: " + err.toString() };
    } finally {
      lock.releaseLock();
    }
  },

  logActivity: function(userId, action, details) {
    try {
      var logItem = {
        id: "ACT-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        user_id: userId || "SYSTEM",
        action: action,
        details: typeof details === "object" ? JSON.stringify(details) : details,
        timestamp: new Date().toISOString()
      };
      this.insertRow("Activity_Logs", logItem);
    } catch (e) {
      Logger.log("Failed to write activity log: " + e.toString());
    }
  }
};

Server.Seed = {
  seedAll: function() {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (e) {
      return { success: false, message: "Unable to acquire lock for seeding." };
    }
    
    try {
      // 1. Ensure all sheets exist with pristine header fields
      Server.DB.initSheets();
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      
      // Clear data to enforce clean reproduction of April 2026 demo state
      var tables = ["Users", "Categories", "Sub_Categories", "Suppliers", "Customers", "Wood_Stocks", "Purchases", "Sales", "Sale_Items", "Payments", "Expenses", "Settings", "Activity_Logs"];
      tables.forEach(function(tbl) {
        var sheet = ss.getSheetByName(tbl);
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        }
      });
      
      // 2. Seed Users
      var users = [
        { id: "U-100", name: "Rameez Admin", email: "admin@example.com", phone: "+8801700000001", password: "password123", role: "admin", avatar_drive_id: "", is_active: true, created_at: "2026-04-01T08:00:00Z", updated_at: "2026-04-01T08:00:00Z" },
        { id: "U-101", name: "Sarah Manager", email: "manager@example.com", phone: "+8801700000002", password: "password123", role: "manager", avatar_drive_id: "", is_active: true, created_at: "2026-04-01T08:30:00Z", updated_at: "2026-04-01T08:30:00Z" },
        { id: "U-102", name: "Karim Cashier", email: "cashier@example.com", phone: "+8801700000003", password: "password123", role: "cashier", avatar_drive_id: "", is_active: true, created_at: "2026-04-01T09:00:00Z", updated_at: "2026-04-01T09:00:00Z" },
        { id: "U-103", name: "Rahim WhStaff", email: "warehouse@example.com", phone: "+8801700000004", password: "password123", role: "warehouse_staff", avatar_drive_id: "", is_active: true, created_at: "2026-04-01T09:15:00Z", updated_at: "2026-04-01T09:15:00Z" }
      ];
      Server.DB.insertRows("Users", users);
      
      // 3. Seed Settings
      var settings = [
        { key: "business_name", value: "Premium Woods Ltd." },
        { key: "business_address", value: "Avenel Industrial Sector, Block D, Suite 4A" },
        { key: "business_phone", value: "+880-1234-567890" },
        { key: "business_email", value: "billing@premiumwoods.com" },
        { key: "tax_rate_percent", value: "0" },
        { key: "currency_symbol", value: "$" }
      ];
      Server.DB.insertRows("Settings", settings);
      
      // 4. Seed Categories
      var categories = [
        { id: "CAT-TEAK", name: "Teak Wood", created_at: "2026-04-01T10:00:00Z" },
        { id: "CAT-MAHOGANY", name: "Mahogany Wood", created_at: "2026-04-01T10:05:00Z" },
        { id: "CAT-OAK", name: "Oak Wood", created_at: "2026-04-01T10:10:00Z" }
      ];
      Server.DB.insertRows("Categories", categories);
      
      // 5. Seed Suppliers
      var suppliers = [
        { id: "SUP-01", name: "Burmese Forestry Co.", contact_person: "Myo Min", phone: "+951-555123", email: "myomin@burmeseforestry.com", address: "Yangon Industrial Hub, Myanmar", created_at: "2026-04-01T10:15:00Z" },
        { id: "SUP-02", name: "Honduras Timber Ltd.", contact_person: "Carlos Ruiz", phone: "+504-999332", email: "carlos@hondurastimber.com", address: "San Pedro Sula Industrial Port, Honduras", created_at: "2026-04-01T10:20:00Z" }
      ];
      Server.DB.insertRows("Suppliers", suppliers);

      // 6. Seed Sub-Categories (Cars / Shipments)
      var sub_categories = [
        { id: "CAR-APR-001", name: "CAR-2026-APR-001", cat_id: "CAT-TEAK", supplier_id: "SUP-01", date: "2026-04-02", created_at: "2026-04-02T11:00:00Z" },
        { id: "CAR-APR-002", name: "CAR-2026-APR-002", cat_id: "CAT-MAHOGANY", supplier_id: "SUP-02", date: "2026-04-05", created_at: "2026-04-05T09:30:00Z" },
        { id: "CAR-APR-003", name: "CAR-2026-APR-003", cat_id: "CAT-OAK", supplier_id: "SUP-01", date: "2026-04-12", created_at: "2026-04-12T14:15:00Z" }
      ];
      Server.DB.insertRows("Sub_Categories", sub_categories);

      // 7. Seed Customers
      var customers = [
        { id: "CUS-01", name: "Grand Furniture Industries", phone: "+8801811122233", email: "procurement@grandfurniture.com", address: "Dhaka Industrial Zone, Bangladesh", credit_limit: "50000", created_at: "2026-04-01T11:30:00Z" },
        { id: "CUS-02", name: "Classic Home Decor", phone: "+8801899988877", email: "info@classichomedecor.com", address: "Chittagong Port Avenue, Bangladesh", credit_limit: "30000", created_at: "2026-04-02T10:00:00Z" },
        { id: "CUS-03", name: "Walnut & Pine Carpentry", phone: "+8801755566611", email: "walnutpine@carpentry.com", address: "Sylhet Bypass Road, Bangladesh", credit_limit: "15000", created_at: "2026-04-10T11:00:00Z" }
      ];
      Server.DB.insertRows("Customers", customers);

      // 8. Seed Wood Stocks (Both available & sold pieces for history/trends)
      var wood_stocks = [
        // CAR-APR-001 (Teak Wood Pieces. Buy rate: $110, Sell rate: $165)
        { serial: "TK-001-A", sub_cat: "CAR-APR-001", purchase_id: "PUR-101", width: "12", length: "144", cft: "12", buy_rate: "110", sell_rate: "165", qty: "1", status: "sold", image_drive_id: "", created_at: "2026-04-02T11:30:00Z" },
        { serial: "TK-002-A", sub_cat: "CAR-APR-001", purchase_id: "PUR-101", width: "14", length: "168", cft: "19.6", buy_rate: "110", sell_rate: "165", qty: "1", status: "sold", image_drive_id: "", created_at: "2026-04-02T11:30:00Z" },
        { serial: "TK-003-A", sub_cat: "CAR-APR-001", purchase_id: "PUR-101", width: "10", length: "120", cft: "8.33", buy_rate: "110", sell_rate: "165", qty: "1", status: "available", image_drive_id: "", created_at: "2026-04-02T11:30:00Z" },
        { serial: "TK-004-A", sub_cat: "CAR-APR-001", purchase_id: "PUR-101", width: "16", length: "180", cft: "20", buy_rate: "110", sell_rate: "165", qty: "1", status: "available", image_drive_id: "", created_at: "2026-04-02T11:30:00Z" },
        { serial: "TK-005-A", sub_cat: "CAR-APR-001", purchase_id: "PUR-101", width: "11", length: "132", cft: "10.08", buy_rate: "110", sell_rate: "165", qty: "1", status: "sold", image_drive_id: "", created_at: "2026-04-02T11:30:00Z" },

        // CAR-APR-002 (Mahogany Wood Pieces. Buy rate: $65, Sell rate: $95)
        { serial: "MH-001-B", sub_cat: "CAR-APR-002", purchase_id: "PUR-102", width: "15", length: "150", cft: "15.63", buy_rate: "65", sell_rate: "95", qty: "1", status: "sold", image_drive_id: "", created_at: "2026-04-05T10:00:00Z" },
        { serial: "MH-002-B", sub_cat: "CAR-APR-002", purchase_id: "PUR-102", width: "18", length: "180", cft: "22.5", buy_rate: "65", sell_rate: "95", qty: "1", status: "available", image_drive_id: "", created_at: "2026-04-05T10:00:00Z" },
        { serial: "MH-003-B", sub_cat: "CAR-APR-002", purchase_id: "PUR-102", width: "12", length: "120", cft: "10", buy_rate: "65", sell_rate: "95", qty: "1", status: "sold", image_drive_id: "", created_at: "2026-04-05T10:00:00Z" },
        { serial: "MH-004-B", sub_cat: "CAR-APR-002", purchase_id: "PUR-102", width: "13", length: "144", cft: "13", buy_rate: "65", sell_rate: "95", qty: "1", status: "available", image_drive_id: "", created_at: "2026-04-05T10:00:00Z" },
        { serial: "MH-005-B", sub_cat: "CAR-APR-002", purchase_id: "PUR-102", width: "14", length: "156", cft: "15.17", buy_rate: "65", sell_rate: "95", qty: "1", status: "available", image_drive_id: "", created_at: "2026-04-05T10:00:00Z" },

        // CAR-APR-003 (Oak Wood Pieces. Buy rate: $85, Sell rate: $135)
        { serial: "OK-001-C", sub_cat: "CAR-APR-003", purchase_id: "PUR-103", width: "14", length: "144", cft: "14", buy_rate: "85", sell_rate: "135", qty: "1", status: "available", image_drive_id: "", created_at: "2026-04-12T15:00:00Z" },
        { serial: "OK-002-C", sub_cat: "CAR-APR-003", purchase_id: "PUR-103", width: "16", length: "192", cft: "21.33", buy_rate: "85", sell_rate: "135", qty: "1", status: "available", image_drive_id: "", created_at: "2026-04-12T15:00:00Z" },
        { serial: "OK-003-C", sub_cat: "CAR-APR-003", purchase_id: "PUR-103", width: "12", length: "120", cft: "10", buy_rate: "85", sell_rate: "135", qty: "1", status: "available", image_drive_id: "", created_at: "2026-04-12T15:00:00Z" }
      ];
      Server.DB.insertRows("Wood_Stocks", wood_stocks);

      // 9. Seed Purchases (Invoices from Suppliers)
      var purchases = [
        { id: "PUR-101", supplier_id: "SUP-01", car_id: "CAR-APR-001", total_amount: "5500", paid_amount: "5500", status: "paid", created_at: "2026-04-02T11:30:00Z" },
        { id: "PUR-102", supplier_id: "SUP-02", car_id: "CAR-APR-002", total_amount: "3200", paid_amount: "2000", status: "partially_paid", created_at: "2026-04-05T10:00:00Z" },
        { id: "PUR-103", supplier_id: "SUP-01", car_id: "CAR-APR-003", total_amount: "2500", paid_amount: "0", status: "unpaid", created_at: "2026-04-12T15:00:00Z" }
      ];
      Server.DB.insertRows("Purchases", purchases);

      // 10. Seed Sales & Sale_Items (Across April 2026)
      var sales = [
        { id: "SAL-401", customer_id: "CUS-01", total_amount: "5238.75", discount: "238.75", net_amount: "5000", paid_amount: "5000", status: "paid", payment_method: "Bank Transfer", created_at: "2026-04-03T10:30:00Z", created_by: "U-102" },
        { id: "SAL-402", customer_id: "CUS-02", total_amount: "2581.35", discount: "81.35", net_amount: "2500", paid_amount: "1500", status: "partially_paid", payment_method: "Cash", created_at: "2026-04-06T14:00:00Z", created_by: "U-102" },
        { id: "SAL-403", customer_id: "CUS-01", total_amount: "950", discount: "0", net_amount: "950", paid_amount: "950", status: "paid", payment_method: "Mobile Pay", created_at: "2026-04-10T16:15:00Z", created_by: "U-102" }
      ];
      Server.DB.insertRows("Sales", sales);

      var sale_items = [
        // SAL-401 items (Teak pieces TK-001-A, TK-002-A sold to CUS-01)
        { id: "SIT-901", sale_id: "SAL-401", serial: "TK-001-A", width: "12", length: "144", cft: "12", rate: "165", amount: "1980" },
        { id: "SIT-902", sale_id: "SAL-401", serial: "TK-002-A", width: "14", length: "168", cft: "19.6", rate: "165", amount: "3234" },
        // SAL-402 items (Mahogany MH-001-B, MH-003-B sold to CUS-02)
        { id: "SIT-903", sale_id: "SAL-402", serial: "MH-001-B", width: "15", length: "150", cft: "15.63", rate: "95", amount: "1484.85" },
        { id: "SIT-904", sale_id: "SAL-402", serial: "MH-003-B", width: "12", length: "120", cft: "10", rate: "95", amount: "950" },
        // SAL-403 item (Teak TK-005-A sold to CUS-01)
        { id: "SIT-905", sale_id: "SAL-403", serial: "TK-005-A", width: "11", length: "132", cft: "10.08", rate: "95", amount: "957.6" }
      ];
      Server.DB.insertRows("Sale_Items", sale_items);

      // 11. Seed Payments (Unified tracker log)
      var payments = [
        { id: "PMT-001", transaction_type: "DEBIT", party_type: "supplier", party_id: "SUP-01", reference_id: "PUR-101", amount: "5500", payment_method: "Bank Transfer", notes: "Full payment for Teak wood car 1", created_at: "2026-04-02T12:00:00Z" },
        { id: "PMT-002", transaction_type: "DEBIT", party_type: "supplier", party_id: "SUP-02", reference_id: "PUR-102", amount: "2000", payment_method: "Cash", notes: "Advance payment for Mahogany shipment", created_at: "2026-04-05T10:15:00Z" },
        { id: "PMT-003", transaction_type: "CREDIT", party_type: "customer", party_id: "CUS-01", reference_id: "SAL-401", amount: "5000", payment_method: "Bank Transfer", notes: "Invoice SAL-401 settled in full", created_at: "2026-04-03T11:00:00Z" },
        { id: "PMT-004", transaction_type: "CREDIT", party_type: "customer", party_id: "CUS-02", reference_id: "SAL-402", amount: "1500", payment_method: "Cash", notes: "Partial cash collection", created_at: "2026-04-06T14:30:00Z" },
        { id: "PMT-005", transaction_type: "CREDIT", party_type: "customer", party_id: "CUS-01", reference_id: "SAL-403", amount: "950", payment_method: "Mobile Pay", notes: "Quick mobile payment for TK-005-A", created_at: "2026-04-10T16:20:00Z" }
      ];
      Server.DB.insertRows("Payments", payments);

      // 12. Seed Expenses
      var expenses = [
        { id: "EXP-301", title: "Warehouse Electricity Bill", category: "Utility", amount: "185", date: "2026-04-10", notes: "April power utilities bill", created_at: "2026-04-10T17:00:00Z" },
        { id: "EXP-302", title: "CAR-APR-001 Freight Costs", category: "Logistics", amount: "420", date: "2026-04-02", notes: "Port freight clearance charges for Burmese Teak", created_at: "2026-04-02T14:00:00Z" },
        { id: "EXP-303", title: "Tea & Office Snacks", category: "Welfare", amount: "35", date: "2026-04-15", notes: "Staff daily refreshment budget", created_at: "2026-04-15T11:30:00Z" }
      ];
      Server.DB.insertRows("Expenses", expenses);

      // 13. Seed Initial Activity Logs
      var logs = [
        { id: "LOG-001", user_id: "U-100", action: "INITIAL_SETUP", details: "Database schemas initialized & seed engine run successfully by Rameez Admin.", timestamp: "2026-04-01T09:30:00Z" }
      ];
      Server.DB.insertRows("Activity_Logs", logs);

      return { success: true, message: "April 2026 Demo Data has been successfully seeded across all sheets!" };
    } catch (e) {
      return { success: false, message: "Database Seeding Execution Failed: " + e.toString() };
    } finally {
      lock.releaseLock();
    }
  }
};

// --- RUN DEMO DATA WRAPPER ---
function setupDemoData() {
  var res = Server.Seed.seedAll();
  Logger.log(res.message);
  return res;
}


// --- SERVER AUTHENTICATION SYSTEM (Server.Auth) ---
var Server = Server || {};

Server.Auth = {
  /**
   * Validates credentials and checks active state. Includes input sanitization.
   */
  validateUser: function(email, password) {
    if (!email || !password) {
      return { success: false, message: "Email and password are required." };
    }
    var sanitizedEmail = email.toString().trim().toLowerCase();
    var sanitizedPassword = password.toString().trim();
    return this.login(sanitizedEmail, sanitizedPassword);
  },

  /**
   * Generates a dynamic session tracking record and logs the active audit event.
   */
  createSession: function(user) {
    if (!user || !user.id) {
      return { success: false, message: "A valid user object is required for session initialization." };
    }
    Server.DB.logActivity(user.id, "SESSION_CREATED", "User session active with authorized role: " + user.role);
    return { 
      success: true, 
      session: { 
        token: "SES-" + Date.now() + "-" + Math.floor(Math.random() * 1000000), 
        user: user,
        created_at: new Date().toISOString()
      } 
    };
  },

  /**
   * Terminates active session and records audit event logs.
   */
  destroySession: function(userId) {
    Server.DB.logActivity(userId || "unknown", "SESSION_DESTROYED", "Terminal session safely terminated.");
    return { success: true, message: "Session successfully signed out." };
  },

  /**
   * Prepares and dispatches 6-digit dynamic OTP credentials.
   */
  sendOTP: function(email) {
    if (!email) {
      return { success: false, message: "Terminal email ID is required." };
    }
    var sanitizedEmail = email.toString().trim().toLowerCase();
    return this.requestOTP(sanitizedEmail);
  },

  /**
   * Verifies the standard 6-digit verification code token and checks expiry window (10 minutes).
   */
  verifyOTP: function(email, otp) {
    if (!email || !otp) {
      return { success: false, message: "Email and validation OTP are required." };
    }
    var sanitizedEmail = email.toString().trim().toLowerCase();
    var sanitizedOtp = otp.toString().trim();
    
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName("Users");
      if (!sheet) return { success: false, message: "Users data store not found." };
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var emailIdx = headers.indexOf("email");
      var otpIdx = headers.indexOf("otp");
      var expIdx = headers.indexOf("otp_expires");
      
      if (emailIdx === -1 || otpIdx === -1 || expIdx === -1) {
        return { success: false, message: "Users sheet schema is corrupt." };
      }
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][emailIdx] === sanitizedEmail) {
          var storedOtp = data[i][otpIdx].toString().trim();
          var expiryString = data[i][expIdx];
          
          if (!storedOtp || storedOtp !== sanitizedOtp) {
            return { success: false, message: "Verification OTP mismatch." };
          }
          
          var now = new Date();
          var expiryDate = new Date(expiryString);
          if (isNaN(expiryDate.getTime()) || expiryDate < now) {
            return { success: false, message: "Verification OTP code has expired." };
          }
          
          return { success: true, message: "Verification token verified successfully." };
        }
      }
      return { success: false, message: "Security profile matches no active credentials." };
    } catch (err) {
      return { success: false, message: "Database lookup failed: " + err.toString() };
    }
  },

  /**
   * Resets the credential password after successful OTP verification.
   */
  resetPassword: function(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      return { success: false, message: "Parameters email, otp and new password are required." };
    }
    var sanitizedEmail = email.toString().trim().toLowerCase();
    var sanitizedOtp = otp.toString().trim();
    var sanitizedPass = newPassword.toString().trim();
    
    if (sanitizedPass.length < 8) {
      return { success: false, message: "The security password must be at least 8 characters long." };
    }
    
    var tokenVerify = this.verifyOTP(sanitizedEmail, sanitizedOtp);
    if (!tokenVerify.success) {
      return tokenVerify;
    }
    
    return this.verifyOTPAndResetPassword(sanitizedEmail, sanitizedOtp, sanitizedPass);
  },

  /**
   * Validates user credentials and returns user details.
   * @param {string} email
   * @param {string} password
   * @return {object} Result object containing success state and user info or error message.
   */
  login: function(email, password) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return { success: false, message: "Server is busy. Please try again." };
    }
    
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName("Users");
      if (!sheet) {
        return { success: false, message: "Users storage not found." };
      }
      
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return { success: false, message: "No registered users." };
      }
      
      var headers = data[0];
      var emailIdx = headers.indexOf("email");
      var passIdx = headers.indexOf("password");
      var activeIdx = headers.indexOf("is_active");
      
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (row[emailIdx] === email && row[passIdx] === password) {
          if (row[activeIdx] === false || row[activeIdx] === "false") {
            return { success: false, message: "This account has been deactivated." };
          }
          
          // Build user object
          var user = {};
          headers.forEach(function(header, idx) {
            if (header !== "password" && header !== "otp" && header !== "otp_expires") {
              user[header] = row[idx];
            }
          });
          return { success: true, user: user };
        }
      }
      
      return { success: false, message: "Invalid email or password." };
    } catch (err) {
      return { success: false, message: "Database error: " + err.toString() };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Generates a 6-digit OTP, stores it with 10-minute expiry, and sends via MailApp.
   * @param {string} email
   * @return {object} Result object.
   */
  requestOTP: function(email) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return { success: false, message: "Server is busy. Please try again." };
    }
    
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName("Users");
      if (!sheet) return { success: false, message: "Users storage not found." };
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var emailIdx = headers.indexOf("email");
      var otpIdx = headers.indexOf("otp");
      var expIdx = headers.indexOf("otp_expires");
      
      if (emailIdx === -1 || otpIdx === -1 || expIdx === -1) {
        return { success: false, message: "Database schema mismatch." };
      }
      
      var userRowIndex = -1;
      for (var i = 1; i < data.length; i++) {
        if (data[i][emailIdx] === email) {
          userRowIndex = i + 1; // 1-based Row Index in Sheets
          break;
        }
      }
      
      if (userRowIndex === -1) {
        return { success: false, message: "No user found with this email address." };
      }
      
      // Generate 6-digit numeric OTP
      var otp = Math.floor(100000 + Math.random() * 900000).toString();
      var expiryTime = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry
      
      // Update values in the sheet
      sheet.getRange(userRowIndex, otpIdx + 1).setValue(otp);
      sheet.getRange(userRowIndex, expIdx + 1).setValue(expiryTime);
      
      // Send Email via MailApp
      var businessName = "Woody POS";
      try {
        var settingsSheet = ss.getSheetByName("Settings");
        if (settingsSheet) {
          var sData = settingsSheet.getDataRange().getValues();
          for (var k = 0; k < sData.length; k++) {
            if (sData[k][0] === "business_name") {
              businessName = sData[k][1];
              break;
            }
          }
        }
      } catch (e) {
        // Fallback to default
      }
      
      var subject = "Your One-Time Password (OTP) for " + businessName;
      var body = "Hello,\n\n" +
                 "You requested a password reset for your account at " + businessName + ".\n\n" +
                 "Your 6-digit OTP code is: " + otp + "\n" +
                 "This code will expire in 10 minutes.\n\n" +
                 "If you did not request this, please ignore this email.\n\n" +
                 "Best regards,\n" +
                 businessName + " Team";
                 
      MailApp.sendEmail(email, subject, body);
      
      return { success: true, message: "OTP has been successfully sent to " + email };
    } catch (err) {
      return { success: false, message: "Failed to process request: " + err.toString() };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Verifies the 6-digit OTP and updates user's password.
   * @param {string} email
   * @param {string} otp
   * @param {string} newPassword
   * @return {object} Result object.
   */
  verifyOTPAndResetPassword: function(email, otp, newPassword) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return { success: false, message: "Server is busy. Please try again." };
    }
    
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName("Users");
      if (!sheet) return { success: false, message: "Users storage not found." };
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var emailIdx = headers.indexOf("email");
      var passIdx = headers.indexOf("password");
      var otpIdx = headers.indexOf("otp");
      var expIdx = headers.indexOf("otp_expires");
      var updatedIdx = headers.indexOf("updated_at");
      
      if (emailIdx === -1 || passIdx === -1 || otpIdx === -1 || expIdx === -1) {
        return { success: false, message: "Database schema mismatch." };
      }
      
      var userRowIndex = -1;
      var matchedRow = null;
      for (var i = 1; i < data.length; i++) {
        if (data[i][emailIdx] === email) {
          userRowIndex = i + 1;
          matchedRow = data[i];
          break;
        }
      }
      
      if (userRowIndex === -1 || !matchedRow) {
        return { success: false, message: "No user found with this email address." };
      }
      
      var storedOtp = matchedRow[otpIdx].toString().trim();
      var expiryString = matchedRow[expIdx];
      
      if (!storedOtp || storedOtp !== otp.toString().trim()) {
        return { success: false, message: "Invalid OTP code. Please try again." };
      }
      
      var now = new Date();
      var expiryDate = new Date(expiryString);
      if (isNaN(expiryDate.getTime()) || expiryDate < now) {
        return { success: false, message: "This OTP has expired. Please request a new one." };
      }
      
      // Update Password & Clear OTP fields
      sheet.getRange(userRowIndex, passIdx + 1).setValue(newPassword);
      sheet.getRange(userRowIndex, otpIdx + 1).setValue("");
      sheet.getRange(userRowIndex, expIdx + 1).setValue("");
      if (updatedIdx !== -1) {
        sheet.getRange(userRowIndex, updatedIdx + 1).setValue(new Date().toISOString());
      }
      
      return { success: true, message: "Password has been reset successfully. You can now login with your new password." };
    } catch (err) {
      return { success: false, message: "Failed to reset password: " + err.toString() };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Performs server-side validation to ensure user has proper authorized role.
   * @param {string} userId
   * @param {Array<string>} allowedRoles
   * @return {boolean} True if authorized, false otherwise.
   */
  checkRole: function(userId, allowedRoles) {
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName("Users");
      if (!sheet) return false;
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var idIdx = headers.indexOf("id");
      var roleIdx = headers.indexOf("role");
      var activeIdx = headers.indexOf("is_active");
      
      if (idIdx === -1 || roleIdx === -1) return false;
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][idIdx].toString() === userId.toString()) {
          // Check active state
          if (activeIdx !== -1) {
            var activeVal = data[i][activeIdx];
            if (activeVal === false || activeVal === "false") {
              return false; // Deactivated user is denied access
            }
          }
          var userRole = data[i][roleIdx];
          return allowedRoles.indexOf(userRole) !== -1;
        }
      }
    } catch (err) {
      Logger.log("checkRole error: " + err.toString());
    }
    return false;
  }
};

// --- FRONTEND AUTH LOGICAL CAPABILITY ALIASING ---
var APP = APP || {};
APP.Auth = Server.Auth;

// --- SERVER POS MODULE (Server.POS) ---
Server.POS = {
  getInitData: function(userId) {
    if (!Server.Auth.checkRole(userId, ["admin", "manager", "cashier"])) {
      return { success: false, message: "Unauthorized permission." };
    }
    return {
      success: true,
      data: {
        stocks: Server.DB.getTable("Wood_Stocks").filter(function(w) { return w.status === "available"; }),
        subCategories: Server.DB.getTable("Sub_Categories"),
        categories: Server.DB.getTable("Categories"),
        customers: Server.DB.getTable("Customers"),
        settings: Server.DB.getTable("Settings")
      }
    };
  },
  
  createSale: function(userId, payload) {
    if (!Server.Auth.checkRole(userId, ["admin", "manager", "cashier"])) {
      return { success: false, message: "Unauthorized permission." };
    }
    
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return { success: false, message: "Database is busy. Please try processing payment again." };
    }
    
    try {
      var saleId = "SAL-" + Date.now();
      var now = new Date().toISOString();
      
      var totalAmount = Number(payload.totalAmount || 0);
      var discount = Number(payload.discount || 0);
      var netAmount = totalAmount - discount;
      var paidAmount = Number(payload.paidAmount || 0);
      var status = "unpaid";
      if (paidAmount >= netAmount) {
        status = "paid";
      } else if (paidAmount > 0) {
        status = "partially_paid";
      }
      
      var saleRecord = {
        id: saleId,
        customer_id: payload.customerId || "CUS-WALKIN",
        total_amount: totalAmount,
        discount: discount,
        net_amount: netAmount,
        paid_amount: paidAmount,
        status: status,
        payment_method: payload.paymentMethod || "Cash",
        created_at: now,
        created_by: userId
      };
      
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var stockSheet = ss.getSheetByName("Wood_Stocks");
      var stockData = stockSheet.getDataRange().getValues();
      var stockHeaders = stockData[0];
      var serialIdx = stockHeaders.indexOf("serial");
      var statusIdx = stockHeaders.indexOf("status");
      
      var saleItems = [];
      var serialsToMarkSold = payload.items.map(function(item) { return item.serial; });
      
      for (var i = 1; i < stockData.length; i++) {
        var serial = stockData[i][serialIdx];
        if (serialsToMarkSold.indexOf(serial) !== -1) {
          if (stockData[i][statusIdx] !== "available") {
            throw new Error("Piece " + serial + " is no longer available.");
          }
          stockSheet.getRange(i + 1, statusIdx + 1).setValue("sold");
        }
      }
      
      payload.items.forEach(function(item, idx) {
        saleItems.push({
          id: "SIT-" + Date.now() + "-" + idx,
          sale_id: saleId,
          serial: item.serial,
          width: item.width || "",
          length: item.length || "",
          cft: item.cft || "0",
          rate: item.sell_rate || "0",
          amount: Number(item.sell_rate || 0) * 1
        });
      });
      
      Server.DB.insertRow("Sales", saleRecord);
      Server.DB.insertRows("Sale_Items", saleItems);
      
      if (paidAmount > 0) {
        var pmtRecord = {
          id: "PMT-COL-" + Date.now(),
          transaction_type: "CREDIT",
          party_type: "customer",
          party_id: payload.customerId || "CUS-WALKIN",
          reference_id: saleId,
          amount: paidAmount,
          payment_method: payload.paymentMethod || "Cash",
          notes: "Collected at sale POS",
          created_at: now
        };
        Server.DB.insertRow("Payments", pmtRecord);
      }
      
      Server.DB.logActivity(userId, "SALE_CREATED", "Invoice: " + saleId + ", Net Amount: " + netAmount);
      return { success: true, data: { saleId: saleId }, message: "Sale transaction submitted successfully." };
      
    } catch (err) {
      return { success: false, message: "Sale checkout failed: " + err.toString() };
    } finally {
      lock.releaseLock();
    }
  }
};

// --- SERVER INVENTORY MODULE (Server.Inventory) ---
Server.Inventory = {
  getInitData: function(userId) {
    if (!Server.Auth.checkRole(userId, ["admin", "manager", "warehouse_staff"])) {
      return { success: false, message: "Unauthorized permission." };
    }
    return {
      success: true,
      data: {
        stocks: Server.DB.getTable("Wood_Stocks"),
        subCategories: Server.DB.getTable("Sub_Categories"),
        suppliers: Server.DB.getTable("Suppliers"),
        categories: Server.DB.getTable("Categories")
      }
    };
  },
  
  upsertWoodStock: function(userId, item) {
    if (!Server.Auth.checkRole(userId, ["admin", "manager", "warehouse_staff"])) {
      return { success: false, message: "Unauthorized permission." };
    }
    
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return { success: false, message: "Database is busy." };
    }
    
    try {
      var isNew = true;
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName("Wood_Stocks");
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var serialIdx = headers.indexOf("serial");
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][serialIdx].toString() === item.serial.toString()) {
          isNew = false;
          break;
        }
      }
      
      var now = new Date().toISOString();
      if (isNew) {
        item.qty = item.qty || 1;
        item.status = item.status || "available";
        item.created_at = now;
        var res = Server.DB.insertRow("Wood_Stocks", item);
        if (!res.success) return res;
        Server.DB.logActivity(userId, "STOCK_ADD", "Added stock piece: " + item.serial);
        return { success: true, message: "Wood Piece stock record created successfully." };
      } else {
        var serial = item.serial;
        delete item.serial;
        var res = Server.DB.updateRow("Wood_Stocks", "serial", serial, item);
        if (!res.success) return res;
        Server.DB.logActivity(userId, "STOCK_UPDATE", "Updated stock piece: " + serial);
        return { success: true, message: "Wood Piece stock record updated successfully." };
      }
    } catch (err) {
      return { success: false, message: "Stock upsert failed: " + err.toString() };
    } finally {
      lock.releaseLock();
    }
  },
  
  bulkImportCSV: function(userId, parsedRows) {
    if (!Server.Auth.checkRole(userId, ["admin", "manager", "warehouse_staff"])) {
      return { success: false, message: "Unauthorized permission." };
    }
    
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (e) {
      return { success: false, message: "Server is busy. Bulk import timed out." };
    }
    
    try {
      var now = new Date().toISOString();
      var preparedItems = [];
      
      parsedRows.forEach(function(row) {
        preparedItems.push({
          serial: row.serial,
          sub_cat: row.sub_cat || row.car_id || "",
          purchase_id: row.purchase_id || "",
          width: row.width || "0",
          length: row.length || "0",
          cft: row.cft || "0",
          buy_rate: row.buy_rate || "0",
          sell_rate: row.sell_rate || "0",
          qty: 1,
          status: "available",
          image_drive_id: "",
          created_at: now
        });
      });
      
      var res = Server.DB.insertRows("Wood_Stocks", preparedItems);
      if (res.success) {
        Server.DB.logActivity(userId, "STOCK_BULK_IMPORT", "Imported " + preparedItems.length + " wood piece records.");
        return { success: true, message: "Bulk dynamic import completed! Successfully added " + preparedItems.length + " pieces." };
      } else {
        return res;
      }
    } catch (err) {
      return { success: false, message: "Bulk import failed: " + err.toString() };
    } finally {
      lock.releaseLock();
    }
  },
  
  uploadPieceImage: function(userId, serial, base64Data, mimeType) {
    if (!Server.Auth.checkRole(userId, ["admin", "manager", "warehouse_staff"])) {
      return { success: false, message: "Unauthorized permission." };
    }
    
    try {
      var folderName = "Woody_POS_Images";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
      
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, mimeType, "TK-" + serial + ".png");
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var fileId = file.getId();
      
      var res = Server.DB.updateRow("Wood_Stocks", "serial", serial, { image_drive_id: fileId });
      if (res.success) {
        Server.DB.logActivity(userId, "STOCKS_IMAGE_UPLOAD", "Uploaded photo for " + serial);
        return { success: true, data: fileId, message: "Image associated successfully." };
      } else {
        return res;
      }
    } catch (err) {
      return { success: false, message: "Image upload failed: " + err.toString() };
    }
  }
};

// --- SERVER REPORTS & PIL MODULE (Server.Reports) ---
Server.Reports = {
  getReportsData: function(userId, startDate, endDate) {
    if (!Server.Auth.checkRole(userId, ["admin", "manager"])) {
      return { success: false, message: "Unauthorized permission." };
    }
    
    try {
      var sales = Server.DB.getTable("Sales");
      var saleItems = Server.DB.getTable("Sale_Items");
      var woodStocks = Server.DB.getTable("Wood_Stocks");
      var subCategories = Server.DB.getTable("Sub_Categories");
      var expenses = Server.DB.getTable("Expenses");
      var payments = Server.DB.getTable("Payments");
      
      if (startDate) {
        var start = new Date(startDate);
        sales = sales.filter(function(s) { return new Date(s.created_at) >= start; });
        expenses = expenses.filter(function(e) { return new Date(e.date) >= start; });
      }
      if (endDate) {
        var end = new Date(endDate);
        sales = sales.filter(function(s) { return new Date(s.created_at) <= end; });
        expenses = expenses.filter(function(e) { return new Date(e.date) <= end; });
      }
      
      var totalRevenue = sales.reduce(function(acc, s) { return acc + Number(s.net_amount || 0); }, 0);
      var totalDiscount = sales.reduce(function(acc, s) { return acc + Number(s.discount || 0); }, 0);
      var totalPaymentsCollected = sales.reduce(function(acc, s) { return acc + Number(s.paid_amount || 0); }, 0);
      var totalExpenses = expenses.reduce(function(acc, e) { return acc + Number(e.amount || 0); }, 0);
      
      var soldSerials = saleItems.map(function(si) { return si.serial; });
      var totalCostOfGoodsSold = woodStocks.reduce(function(acc, piece) {
        if (soldSerials.indexOf(piece.serial) !== -1) {
          return acc + Number(piece.buy_rate || 0) * Number(piece.cft || 0);
        }
        return acc;
      }, 0);
      
      var grossProfit = totalRevenue - totalCostOfGoodsSold;
      var netProfit = grossProfit - totalExpenses;
      
      var aging = { "30_days": 0, "90_days": 0, "180_days": 0, "older": 0 };
      var now = new Date();
      woodStocks.forEach(function(p) {
        if (p.status !== "available") return;
        var ageInMs = now - new Date(p.created_at || now);
        var ageInDays = ageInMs / (1000 * 60 * 60 * 24);
        if (ageInDays <= 30) {
          aging["30_days"]++;
        } else if (ageInDays <= 90) {
          aging["90_days"]++;
        } else if (ageInDays <= 180) {
          aging["180_days"]++;
        } else {
          aging["older"]++;
        }
      });
      
      var carPerformance = {};
      subCategories.forEach(function(sc) {
        carPerformance[sc.id] = {
          id: sc.id,
          name: sc.name,
          date: sc.date,
          totalCftPurchased: 0,
          totalCost: 0,
          totalCftSold: 0,
          totalRevenue: 0,
          netProfit: 0,
          status: "Active"
        };
      });
      
      woodStocks.forEach(function(p) {
        var carId = p.sub_cat;
        if (carPerformance[carId]) {
          var cft = Number(p.cft || 0);
          var buyRate = Number(p.buy_rate || 0);
          var sellRate = Number(p.sell_rate || 0);
          
          carPerformance[carId].totalCftPurchased += cft;
          carPerformance[carId].totalCost += cft * buyRate;
          
          if (p.status === "sold") {
            carPerformance[carId].totalCftSold += cft;
            carPerformance[carId].totalRevenue += cft * sellRate;
          }
        }
      });
      
      var carList = [];
      for (var cid in carPerformance) {
        var cp = carPerformance[cid];
        cp.netProfit = cp.totalRevenue - cp.totalCost;
        if (cp.totalCftSold >= cp.totalCftPurchased) {
          cp.status = "Cleared";
        }
        carList.push(cp);
      }
      
      return {
        success: true,
        data: {
          summary: {
            totalRevenue: totalRevenue,
            totalDiscount: totalDiscount,
            totalPaymentsCollected: totalPaymentsCollected,
            totalExpenses: totalExpenses,
            totalCostOfGoodsSold: totalCostOfGoodsSold,
            grossProfit: grossProfit,
            netProfit: netProfit
          },
          aging: aging,
          carList: carList,
          sales: sales,
          expenses: expenses,
          payments: payments
        }
      };
    } catch (err) {
      return { success: false, message: "Report generation failed: " + err.toString() };
    }
  }
};

// --- GLOBAL EXPOSED ENDPOINTS FOR CLIENT (google.script.run) ---
function login(email, password) {
  return Server.Auth.login(email, password);
}

function validateUser(email, password) {
  return Server.Auth.validateUser(email, password);
}

function createSession(user) {
  return Server.Auth.createSession(user);
}

function destroySession(userId) {
  return Server.Auth.destroySession(userId);
}

function sendOTP(email) {
  return Server.Auth.sendOTP(email);
}

function verifyOTP(email, otp) {
  return Server.Auth.verifyOTP(email, otp);
}

function resetPassword(email, otp, newPassword) {
  return Server.Auth.resetPassword(email, otp, newPassword);
}

function requestOTP(email) {
  return Server.Auth.requestOTP(email);
}

function verifyOTPAndResetPassword(email, otp, newPassword) {
  return Server.Auth.verifyOTPAndResetPassword(email, otp, newPassword);
}

function getPOSInitData(userId) {
  return Server.POS.getInitData(userId);
}

function createSale(userId, payload) {
  return Server.POS.createSale(userId, payload);
}

function getInventoryInitData(userId) {
  return Server.Inventory.getInitData(userId);
}

// Global wrap for backward compatible App.tsx mock routes
function getInventory() {
  return Server.DB.getTable("Wood_Stocks");
}

function upsertWoodStock(userId, item) {
  return Server.Inventory.upsertWoodStock(userId, item);
}

function bulkImportCSV(userId, items) {
  return Server.Inventory.bulkImportCSV(userId, items);
}

function uploadPieceImage(userId, serial, base64Data, mimeType) {
  return Server.Inventory.uploadPieceImage(userId, serial, base64Data, mimeType);
}

function getReportsData(userId, startDate, endDate) {
  return Server.Reports.getReportsData(userId, startDate, endDate);
}

