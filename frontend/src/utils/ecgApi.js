/**
 * ecgApi.js
 * Thin wrappers around the Flask REST API.
 * All functions return plain JS objects / arrays.
 */

const BASE = process.env.REACT_APP_API_URL || "";  // "" → uses CRA proxy → localhost:5000

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

/** Fetch all patients from SQLite */
export async function getPatients() {
  return get("/api/patients");
}

/** Fetch a single patient record */
export async function getPatient(patientId) {
  return get(`/api/patients/${patientId}`);
}

/**
 * Fetch all leads for a time window in one request.
 * Returns { leads: { II: number[], ... }, sr: 250, start, duration }
 *
 * @param {string} patientId
 * @param {3|12}   nLeads
 * @param {number} startSec
 * @param {number} durationSec   max 30
 */
export async function getAllLeads(patientId, nLeads, startSec, durationSec = 10) {
  const url =
    `/api/ecg/${patientId}/${nLeads}/all` +
    `?start=${startSec.toFixed(2)}&duration=${durationSec}`;
  return get(url);
}

/**
 * Fetch a single lead window.
 * Returns { lead, sr, start, samples: number[] }
 */
export async function getLead(patientId, nLeads, leadName, startSec, durationSec = 10) {
  const url =
    `/api/ecg/${patientId}/${nLeads}` +
    `?lead=${leadName}&start=${startSec.toFixed(2)}&duration=${durationSec}`;
  return get(url);
}
