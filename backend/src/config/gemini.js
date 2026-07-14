import { GoogleGenerativeAI } from "@google/generative-ai";

let _client = null;

export function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!_client) {
    _client = new GoogleGenerativeAI(key);
  }
  return _client;
}

export function isGeminiAvailable() {
  return Boolean(process.env.GEMINI_API_KEY);
}
