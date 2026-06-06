import client from "./client";

/**
 * Verify a Paystack payment reference and activate the subscription
 */
export const verifySubscription = async (payload: {
  reference: string;
  plan: string;
  billing: string;
}) => {
  const response = await client.post("/subscriptions/verify", payload);
  return response.data;
};

/**
 * Fetch current subscription status for the logged-in user
 */
export const getSubscriptionStatus = async () => {
  const response = await client.get("/subscriptions/status");
  return response.data;
};