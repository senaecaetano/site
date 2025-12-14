const SHEET_ID = '18F3db9qk0VO7TRStmmBjws5mhHnr47zFTGB_6XYOcHg';
const SHEET_NAME = 'Leads';
const REDIRECT_URL = 'https://www.senaecaetano.com.br/obrigado';
const HEADER_ROW = ['DATA/HORA', 'NOME', 'EMAIL', 'WHATSAPP'];

function doOptions() {
  return buildResponse({ ok: true, message: 'ok' });
}

function doPost(e) {
  const debug = [];
  try {
    debug.push('Received POST');
    const payload = parseRequest(e, debug);
    const normalized = normalizePayload(payload, debug);
    const sheet = getSheet();
    ensureHeader(sheet, debug);
    appendRow(sheet, normalized, debug);
    debug.push('Row appended');
    return buildResponse({
      ok: true,
      redirect: REDIRECT_URL,
      received: {
        nome: normalized.nome,
        email: normalized.email,
        whatsapp: normalized.whatsapp
      }
    });
  } catch (err) {
    debug.push('Error: ' + err);
    Logger.log(err);
    return buildResponse({ ok: false, error: String(err), debug });
  } finally {
    Logger.log(debug.join(' | '));
  }
}

function parseRequest(e, debug) {
  if (!e) throw new Error('Empty event');
  const postData = e.postData;
  if (postData && postData.type && postData.contents) {
    const contentType = postData.type.toLowerCase();
    if (contentType.indexOf('json') !== -1) {
      debug.push('Parsing JSON body');
      return JSON.parse(postData.contents);
    }
    if (contentType.indexOf('x-www-form-urlencoded') !== -1) {
      debug.push('Parsing form-urlencoded body');
      return Utilities.parseQueryString(postData.contents);
    }
  }
  debug.push('Using query parameters');
  return e.parameter || {};
}

function normalizePayload(payload, debug) {
  if (!payload) throw new Error('Missing payload');
  const clean = function (val) { return (val || '').toString().trim(); };
  const normalizePhone = function (raw) { return clean(raw).replace(/\D+/g, ''); };
  const result = {
    timestamp: new Date(),
    nome: clean(payload.nome),
    email: clean(payload.email),
    whatsapp: normalizePhone(payload.whatsapp)
  };
  debug.push('Normalized payload');
  return result;
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function ensureHeader(sheet, debug) {
  const firstRow = sheet.getRange(1, 1, 1, HEADER_ROW.length).getValues()[0];
  const needsHeader = firstRow.join('') === '' || firstRow.some(function (cell, idx) {
    return String(cell).toUpperCase() !== HEADER_ROW[idx];
  });
  if (needsHeader) {
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
    debug.push('Header ensured');
  }
}

function appendRow(sheet, payload, debug) {
  const row = [payload.timestamp, payload.nome, payload.email, payload.whatsapp];
  sheet.appendRow(row);
  debug.push('Row: ' + JSON.stringify(row));
}

function buildResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
