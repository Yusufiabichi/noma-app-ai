import client from "./client";

export const listExperts = (params: {
  scanId?: string;
  cropType?: string;
  sortBy?: "rating" | "cases" | "experience";
}) => client.get("/experts", { params });

export const getExpertAssignedCases = (params?: { status?: string }) =>
  client.get('/experts/cases/assigned', { params });

export const createCase = (data: {
  expertUserId: string;
  scanId: string;
  farmerNote?: string;
}) => client.post("/experts/cases", data);

export const getMyCases = () => client.get("/experts/cases/mine");

export const getCaseDetail = (id: string) => client.get(`/experts/cases/${id}`);