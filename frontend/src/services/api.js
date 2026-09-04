import axios from 'axios';

const api = axios.create({
  baseURL: 'https://foia-ed5c.onrender.com/api'
});

export const getAssessments = (params = {}) => {
  return api.get('/assessments', { params });
};

export const getAssessmentById = (id) => {
  return api.get(`/assessments/${id}`);
};

export const submitAssessment = (data, config = {}) => {
  return api.post('/assessments/submit', data, config);
};

export const uploadImage = (formData, config = {}) => {
  return api.post('/assessments/upload-image', formData, config);
};

export const generateSample = (id, data) => {
  return api.post(`/assessments/${id}/generate-sample`, data);
};

export default api;
