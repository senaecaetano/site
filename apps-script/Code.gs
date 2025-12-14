const SHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Leads';
const REDIRECT_URL = 'https://www.senaecaetano.com.br/obrigado';

function doOptions() {
  return buildResponse({ ok: true, message: 'ok' }, 200);
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
    return buildResponse({ ok: true, redirect: REDIRECT_URL, received: normalized }, 200);
  } catch (err) {
    debug.push('Error: ' + err);
    Logger.log(err);
    return buildResponse({ ok: false, error: String(err), debug }, 500);
  } finally {
    Logger.log(debug.join(' | '));
  }
}

function parseRequest(e, debug) {
  if (!e) throw new Error('Empty event');
  const hasJson = e.postData && e.postData.type && e.postData.type.indexOf('json') !== -1;
  if (hasJson && e.postData.contents) {
    debug.push('Parsing JSON body');
    return JSON.parse(e.postData.contents);
  }
  debug.push('Parsing form body');
  const params = e.parameter || {};
  return {
    nome: params.nome,
    email: params.email,
    whatsapp: params.whatsapp,
    utm_source: params.utm_source,
    utm_medium: params.utm_medium,
    utm_campaign: params.utm_campaign,
    utm_content: params.utm_content,
    utm_term: params.utm_term,
    referrer: params.referrer,
    user_agent: params.user_agent,
    audience: params.audience,
    page: params.page
  };
}

function normalizePayload(payload, debug) {
  if (!payload) throw new Error('Missing payload');
  const normalizePhone = function (raw) {
    if (!raw) return '';
    return String(raw).replace(/\D+/g, '');
  };
  const clean = function (val) {
    return (val || '').toString().trim();
  };
  const result = {
    timestamp: new Date(),
    nome: clean(payload.nome),
    email: clean(payload.email),
    whatsapp: normalizePhone(payload.whatsapp),
    utm_source: clean(payload.utm_source),
    utm_medium: clean(payload.utm_medium),
    utm_campaign: clean(payload.utm_campaign),
    utm_content: clean(payload.utm_content),
    utm_term: clean(payload.utm_term),
    referrer: clean(payload.referrer),
    user_agent: clean(payload.user_agent),
    audience: clean(payload.audience),
    page: clean(payload.page),
    debug_status: 'OK'
  };
  debug.push('Normalized payload');
  return result;
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function ensureHeader(sheet, debug) {
  const header = ['TIMESTAMP', 'NOME', 'EMAIL', 'WHATSAPP', 'UTM_SOURCE', 'UTM_MEDIUM', 'UTM_CAMPAIGN', 'UTM_CONTENT', 'UTM_TERM', 'REFERRER', 'USER_AGENT', 'AUDIENCE', 'PAGE', 'DEBUG_STATUS'];
  const firstRow = sheet.getRange(1, 1, 1, header.length).getValues()[0];
  const needsHeader = firstRow.join('') === '' || firstRow.some(function (cell, idx) { return String(cell).toUpperCase() !== header[idx]; });
  if (needsHeader) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    debug.push('Header ensured');
  }
}

function appendRow(sheet, payload, debug) {
  const row = [
    payload.timestamp,
    payload.nome,
    payload.email,
    payload.whatsapp,
    payload.utm_source,
    payload.utm_medium,
    payload.utm_campaign,
    payload.utm_content,
    payload.utm_term,
    payload.referrer,
    payload.user_agent,
    payload.audience,
    payload.page,
    payload.debug_status
  ];
  sheet.appendRow(row);
  debug.push('Row: ' + JSON.stringify(row));
}

function buildResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output.setResponseCode(statusCode || 200);
}
