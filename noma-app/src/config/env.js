

//const DEV_MACHINE_IP = 'nomaapp-backend-production.up.railway.app';
const DEV_MACHINE_IP = 'http://localhost:3000';
const API_BASE_URL = `${DEV_MACHINE_IP}/api`;
//const API_BASE_URL = `https://${DEV_MACHINE_IP}/api`;
const REQUEST_TIMEOUT_MS = 30000;

export default {
  API_BASE_URL,
  REQUEST_TIMEOUT_MS,
};
