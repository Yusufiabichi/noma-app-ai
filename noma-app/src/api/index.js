/**
 * API Module Index
 * Central export point for all API modules
 * 
 * Usage:
 * import api from '../api';
 * 
 * api.auth.login(email, password);
 * api.farms.createFarm(farmData);
 * api.scans.createScan(scanData);
 */

import client from './client';
import authApi from './auth.api';
import usersApi from './users.api';
import farmsApi from './farms.api';
import scansApi from './scans.api';
import syncApi from './sync.api';

export {
  client,
  authApi,
  usersApi,
  farmsApi,
  scansApi,
  syncApi,
};

export default {
  client,
  auth: authApi,
  users: usersApi,
  farms: farmsApi,
  scans: scansApi,
  sync: syncApi,
};
