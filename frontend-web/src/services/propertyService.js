import api from './api';

async function readResponse(response) {
  if (response.ok) {
    if (response.status === 204) return null;
    return response.json();
  }

  const body = await response.json().catch(() => ({}));
  const error = new Error(body.message || `Request failed with status ${response.status}.`);
  error.status = response.status;
  throw error;
}

export const propertyService = {
  getProperties: () => api.get('/properties').then(readResponse),
  getProperty: (id) => api.get(`/properties/${id}`).then(readResponse),
  getLeases: () => api.get('/leases').then(readResponse),
  getTenants: () => api.get('/users?role=Tenant').then(readResponse),
  createProperty: (data) => {
    const formData = new FormData();
    formData.append('Name', data.name);
    formData.append('Address', data.address);
    formData.append('City', data.city);
    if (data.image) formData.append('Image', data.image);
    data.initialUnits.forEach((unit, index) => {
      formData.append(`InitialUnits[${index}].UnitNumber`, unit.unitNumber);
      formData.append(`InitialUnits[${index}].Floor`, String(unit.floor));
    });
    return api.post('/properties', formData).then(readResponse);
  },
  addUnit: (propertyId, data) => api.post(`/properties/${propertyId}/units`, data).then(readResponse),
  updateProperty: (id, data) => {
    const formData = new FormData();
    formData.append('Name', data.name);
    formData.append('Address', data.address);
    formData.append('City', data.city);
    if (data.image) formData.append('Image', data.image);
    return api.put(`/properties/${id}`, formData).then(readResponse);
  },
  deleteProperty: (id) => api.delete(`/properties/${id}`).then(readResponse),
  updateUnit: (id, data) => api.put(`/properties/units/${id}`, data).then(readResponse),
  deleteUnit: (id) => api.delete(`/properties/units/${id}`).then(readResponse),
  createLease: (data) => api.post('/leases', {
    ...data,
    startDate: `${data.startDate}T00:00:00.000Z`,
    endDate: `${data.endDate}T00:00:00.000Z`,
  }).then(readResponse),
  updateLease: (id, data) => api.put(`/leases/${id}`, {
    ...data,
    startDate: `${data.startDate}T00:00:00.000Z`,
    endDate: `${data.endDate}T00:00:00.000Z`,
  }).then(readResponse),
  terminateLease: (id) => api.patch(`/leases/${id}/terminate`).then(readResponse),
  deleteLease: (id) => api.delete(`/leases/${id}`).then(readResponse),
};
