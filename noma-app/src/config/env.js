
// Environment Configuration

// Centralized environment variables and configuration for the NOMA app.
// Adjust based on development, staging, and production environments.


// Use your computer's IP address instead of localhost to connect from a physical device
// For Android Emulator, you can use 10.0.2.2
const DEV_MACHINE_IP = '192.168.0.2';
const API_BASE_URL = `http://${DEV_MACHINE_IP}:3000/api`;
const REQUEST_TIMEOUT_MS = 30000;

export default {
  API_BASE_URL,
  REQUEST_TIMEOUT_MS,
};
