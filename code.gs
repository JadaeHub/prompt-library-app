/****************************************************************
 * Google Apps Script Backend - Version 4.1 (Final & Robust)
 ****************************************************************/

const PROMPTS_SHEET_NAME = "Prompts";
const CATEGORIES_SHEET_NAME = "Categories";
const CONFIG_SHEET_NAME = "Config";
const ADMINS_SHEET_NAME = "Admins";

/**
 * Handles GET requests from the web app.
 * Fetches all necessary data for the initial page load.
 */
function doGet(e) {
  try {
    const prompts = getPrompts();
    const categories = getCategories();
    const admins = getAdmins();
    
    // Return all data in a single object
    return ContentService
      .createTextOutput(JSON.stringify({ prompts, categories, admins }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests from the web app for all create, update, and delete actions.
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const { action, data } = requestData;
    switch (action) {
      // Prompt Actions
      case 'addPrompt': return handleAddPrompt(data);
      case 'updatePrompt': return handleUpdatePrompt(data);
      case 'deletePrompt': return handleDeletePrompt(data);
      // Category Actions
      case 'addCategory': return handleAddCategory(data);
      // Admin Actions
      case 'addAdmin': return handleAddAdmin(data);
      case 'updateAdmin': return handleUpdateAdmin(data);
      case 'deleteAdmin': return handleDeleteAdmin(data);
      default:
        throw new Error("Invalid 'action' specified in POST request.");
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * A robust helper function to get a sheet by name and throw a clear error if not found.
 */
function getSheet(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Critical Error: A sheet named "${sheetName}" was not found. Please check spelling and capitalization.`);
  }
  return sheet;
}

// --- Data Fetching Functions ---
function getPrompts() {
  const sheet = getSheet(PROMPTS_SHEET_NAME);
  if (sheet.getLastRow() < 2) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.map(row => {
    const prompt = {};
    headers.forEach((header, index) => { prompt[header] = row[index]; });
    return prompt;
  });
}

function getCategories() {
  const sheet = getSheet(CATEGORIES_SHEET_NAME);
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange("A2:A").getValues().flat().filter(String);
}

function getAdmins() {
  const sheet = getSheet(ADMINS_SHEET_NAME);
  if (sheet.getLastRow() < 2) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.map(row => {
    const admin = {};
    headers.forEach((header, index) => {
      if (header.toLowerCase() !== 'password') { admin[header] = row[index]; }
    });
    return admin;
  });
}

// --- Action Handler Functions ---

function handleAddPrompt(data) {
  const promptsSheet = getSheet(PROMPTS_SHEET_NAME);
  const newId = getNextId();
  const newRow = [newId, data.Title, data.Category, data.Difficulty, data.ImageURL, data.Description, data.PromptText, data.Tags, data.Featured];
  promptsSheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({ success: true, newId: newId })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdatePrompt(data) {
  const promptsSheet = getSheet(PROMPTS_SHEET_NAME);
  const idColumnIndex = 1;
  const idValues = promptsSheet.getRange(idColumnIndex, idColumnIndex, promptsSheet.getLastRow()).getValues();
  for (let i = 0; i < idValues.length; i++) {
    if (idValues[i][0] == data.ID) {
      const rowToUpdate = i + 1;
      const newRowData = [data.ID, data.Title, data.Category, data.Difficulty, data.ImageURL, data.Description, data.PromptText, data.Tags, data.Featured];
      promptsSheet.getRange(rowToUpdate, 1, 1, newRowData.length).setValues([newRowData]);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  throw new Error("Prompt ID not found for update.");
}

function handleDeletePrompt(data) {
  const promptsSheet = getSheet(PROMPTS_SHEET_NAME);
  const idColumnIndex = 1;
  const idValues = promptsSheet.getRange(1, idColumnIndex, promptsSheet.getLastRow(), 1).getValues();
  for (let i = idValues.length - 1; i >= 1; i--) {
    if (idValues[i][0] == data.ID) {
      promptsSheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  throw new Error("Prompt ID not found for deletion.");
}

function handleAddCategory(data) {
  const categorySheet = getSheet(CATEGORIES_SHEET_NAME);
  const newCategory = data.CategoryName.trim();
  if (!newCategory) throw new Error("Category name cannot be empty.");
  const existingCategories = categorySheet.getRange("A2:A").getValues().flat().map(c => c.toLowerCase());
  if (existingCategories.includes(newCategory.toLowerCase())) throw new Error(`Category "${newCategory}" already exists.`);
  categorySheet.appendRow([newCategory]);
  return ContentService.createTextOutput(JSON.stringify({ success: true, category: newCategory })).setMimeType(ContentService.MimeType.JSON);
}

function handleAddAdmin(data) {
  const sheet = getSheet(ADMINS_SHEET_NAME);
  const newId = new Date().getTime();
  const newRow = [newId, data.Username, data.Password, data.Role];
  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateAdmin(data) {
  const sheet = getSheet(ADMINS_SHEET_NAME);
  const idColumnIndex = 1;
  const idValues = sheet.getRange(1, idColumnIndex, sheet.getLastRow()).getValues();
  for (let i = 1; i < idValues.length; i++) {
    if (idValues[i][0] == data.ID) {
      const rowToUpdate = i + 1;
      const existingPassword = sheet.getRange(rowToUpdate, 3).getValue();
      const newRowData = [data.ID, data.Username, data.Password ? data.Password : existingPassword, data.Role];
      sheet.getRange(rowToUpdate, 1, 1, newRowData.length).setValues([newRowData]);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  throw new Error("Admin ID not found for update.");
}

function handleDeleteAdmin(data) {
  const sheet = getSheet(ADMINS_SHEET_NAME);
  const idColumnIndex = 1;
  const idValues = sheet.getRange(1, idColumnIndex, sheet.getLastRow()).getValues();
  for (let i = idValues.length - 1; i >= 1; i--) {
    if (idValues[i][0] == data.ID) {
      const adminRole = sheet.getRange(i + 1, 4).getValue();
      if (adminRole === 'Master') throw new Error("Master admin role cannot be deleted.");
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  throw new Error("Admin ID not found for deletion.");
}

function getNextId() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const configSheet = getSheet(CONFIG_SHEET_NAME);
    const idCounterCell = configSheet.getRange("B2");
    const lastId = idCounterCell.getValue();
    const newId = (typeof lastId === 'number' ? lastId : 0) + 1;
    idCounterCell.setValue(newId);
    return newId;
  } finally {
    lock.releaseLock();
  }
}