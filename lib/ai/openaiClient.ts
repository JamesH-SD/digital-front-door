import OpenAI from "openai";

/**
 * Shared OpenAI client for server-side AI utilities.
 *
 * Why this exists:
 * - keeps OpenAI initialization in one place
 * - gives us a single place to validate env setup
 * - makes future AI helpers cleaner and easier to maintain
 *
 * Notes:
 * - this file should only be used from server-side code
 * - AI features should remain non-blocking to the core app flow
 */

let cachedClient: OpenAI | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOpenAIClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = getRequiredEnv("OPENAI_API_KEY");

  cachedClient = new OpenAI({
    apiKey,
  });

  return cachedClient;
}