// api.js
// Centralizes every call to the Django backend.

import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api";

// ----------------------------
// Calculate Emissions
// ----------------------------
export const calculateEmission = (payload) => {
  return axios.post(`${BASE_URL}/calculate/`, payload);
};

// ----------------------------
// Calculation History
// ----------------------------
export const getHistory = () => {
  return axios.get(`${BASE_URL}/history/`);
};

// ----------------------------
// Emission Factors
// ----------------------------
export const getEmissionFactors = () => {
  return axios.get(`${BASE_URL}/emission-factors/`);
};

// ----------------------------
// Companies
// ----------------------------
export const getCompanies = () => {
  return axios.get(`${BASE_URL}/companies/`);
};

// ----------------------------
// Dashboard
// Supports:
//   year
//   company_id
//
// Examples:
// /dashboard/
// /dashboard/?company_id=1
// /dashboard/?company_id=1&year=2026
// ----------------------------
export const getDashboardData = (year, companyId) => {
  const params = {};

  if (year) {
    params.year = year;
  }

  if (companyId) {
    params.company_id = companyId;
  }

  return axios.get(`${BASE_URL}/dashboard/`, {
    params,
  });
};