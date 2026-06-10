import client from "./client";

export const getVerificationStatus = () =>
  client.get("/expert/verification-status");

export const savePushToken = (expoPushToken: string) =>
  client.post("/expert/push-token", { expoPushToken });

export const saveExpertProfile = (data: {
  specializations: string[];
  yearsOfExperience: number;
  currentOrganization: string;
  currentRole: string;
  bio: string;
  linkedIn?: string;
}) => client.post("/expert/profile", data);

export const uploadExpertDocuments = (formData: FormData) =>
  client.post("/expert/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getAssessmentQuestions = () =>
  client.get("/expert/assessment/questions");

export const submitAssessment = (data: {
  answers: { questionId: string; selectedAnswer: string }[];
}) => client.post("/expert/assessment/submit", data);