import { API_URL } from './config';

async function request(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

async function authRequest(path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

async function authGet(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }
  return data;
}

async function authPatch(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }
  return data;
}

export function signupDoctor(payload) {
  return request('/api/auth/signup/doctor', payload);
}

export function signupPatient(payload) {
  return request('/api/auth/signup/patient', payload);
}

export function login(payload) {
  return request('/api/auth/login', payload);
}

export function submitQuestionnaire(token, orderedAnswers) {
  return authRequest('/api/patient/questionnaire', { answers: orderedAnswers }, token);
}

export function getQuestionnaireHistory(token) {
  return authGet('/api/patient/history', token);
}

export function getDoctorPatients(token) {
  return authGet('/api/doctor/patients', token);
}

export function submitCognitiveResult(token, testType, score, details) {
  return authRequest('/api/cognitive/submit', { test_type: testType, score, details }, token);
}

export function getCognitiveHistory(token) {
  return authGet('/api/cognitive/history', token);
}

export function getPatientCognitiveHistory(token, patientId) {
  return authGet(`/api/doctor/patients/${patientId}/cognitive-history`, token);
}

export function getPatientBdiHistory(token, patientId) {
  return authGet(`/api/doctor/patients/${patientId}/bdi-history`, token);
}

export function submitSleepLog(token, hoursSlept, quality) {
  return authRequest('/api/logs/sleep', { hours_slept: hoursSlept, quality }, token);
}

export function getSleepHistory(token) {
  return authGet('/api/logs/sleep', token);
}

export function getPatientSleepHistory(token, patientId) {
  return authGet(`/api/doctor/patients/${patientId}/sleep-history`, token);
}

export function submitWeightLog(token, weightKg) {
  return authRequest('/api/logs/weight', { weight_kg: weightKg }, token);
}

export function getWeightHistory(token) {
  return authGet('/api/logs/weight', token);
}

export function getPatientWeightHistory(token, patientId) {
  return authGet(`/api/doctor/patients/${patientId}/weight-history`, token);
}