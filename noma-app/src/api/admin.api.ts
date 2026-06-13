import client from "./client";

// ─── Expert Verification ──────────────────────────────────────────────────────

export const adminListExperts = (params: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) => client.get("/admin/experts", { params });

export const adminGetExpertDetail = (id: string) =>
  client.get(`/admin/experts/${id}`);

export const adminReviewExpert = (id: string, data: {
  action: "approve" | "reject";
  rejectionReason?: string;
  notes?: string;
}) => client.patch(`/admin/experts/${id}/review`, data);

// ─── Assessment Questions ──────────────────────────────────────────────────────

export const adminListQuestions = (params: {
  difficulty?: string;
  type?: string;
  cropCategory?: string;
  isActive?: boolean;
  page?: number;
}) => client.get("/admin/assessment-questions", { params });

export const adminGetQuestion = (id: string) =>
  client.get(`/admin/assessment-questions/${id}`);

export const adminCreateQuestion = (formData: FormData) =>
  client.post("/admin/assessment-questions", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const adminUpdateQuestion = (id: string, formData: FormData) =>
  client.patch(`/admin/assessment-questions/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const adminDeleteQuestion = (id: string) =>
  client.delete(`/admin/assessment-questions/${id}`);

// ─── Case Oversight ─────────────────────────────────────────────────────────────

export const adminListCases = (params: {
  status?: string;
  page?: number;
  search?: string;
}) => client.get("/admin/cases", { params });

export const adminGetCaseDetail = (id: string) =>
  client.get(`/admin/cases/${id}`);

export const adminUpdateCase = (id: string, data: {
  action: "reassign" | "resolve" | "decline";
  newExpertId?: string;
  adminNote?: string;
}) => client.patch(`/admin/cases/${id}`, data);

// ─── Analytics ────────────────────────────────────────────────────────────────

export const adminGetAnalyticsSummary = () =>
  client.get("/admin/analytics/summary");

// ─── Admin Management ────────────────────────────────────────────────────────────

export const adminListAdmins = () => client.get("/admin/admins");

export const adminInviteAdmin = (data: {
  name: string;
  phone: string;
  password: string;
  adminRole?: "super_admin" | "moderator" | "reviewer";
  permissions?: string[];
}) => client.post("/admin/admins/invite", data);

export const adminUpdateAdmin = (id: string, data: {
  adminRole?: string;
  permissions?: string[];
  isActive?: boolean;
}) => client.patch(`/admin/admins/${id}`, data);