import { GoogleGenAI } from "@google/genai";

// Server-only: the API key is read from .env.local and never sent to the browser.
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// A lightweight model keeps us inside the free tier's limits.
export const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
