import "dotenv/config";
import { genkit } from "genkit";
import { groq, gptOssx20b, llama33x70bVersatile } from "genkitx-groq";

// Falls back to a dummy key only in test runs and during the production build
// (Next sets NEXT_PHASE=phase-production-build) so local/CI lint/typecheck/build
// steps — which import this module but never actually call the model — don't
// need a real Groq key configured. A running server still requires a real key.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const groqApiKey =
  process.env.GROQ_API_KEY ??
  (process.env.NODE_ENV === "test" || isBuildPhase ? "dummy-key-for-build" : undefined);

if (!groqApiKey) {
  throw new Error(
    "GROQ_API_KEY is not set. Provide it via environment variables (see .env.example).",
  );
}

export const ai = genkit({
  plugins: [
    groq({
      apiKey: groqApiKey,
    }),
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// Model references
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fastest Groq model — used by latency-sensitive security-explanation flows.
 *
 * `openai/gpt-oss-20b` is Groq's recommended replacement for the deprecated
 * `llama-3.1-8b-instant` (see https://console.groq.com/docs/deprecations).
 * It runs on Groq's LPU at very high throughput, making it ideal for the
 * streaming security-explanation UI where first-token latency matters.
 *
 * Override via GROQ_SECURITY_MODEL if a different model is needed.
 */
const GROQ_SECURITY_MODEL = process.env.GROQ_SECURITY_MODEL ?? gptOssx20b.name;

/**
 * General-purpose Groq model — used by non-latency-critical flows
 * (e.g. the heist completion-message generator). Defaults to
 * `llama-3.3-70b-versatile` for richer prose. Override via GROQ_MODEL.
 */
const GROQ_DEFAULT_MODEL = process.env.GROQ_MODEL ?? llama33x70bVersatile.name;

/**
 * Model reference flows should use unless they need to override it explicitly.
 * Kept as a string for test-mock compatibility (tests mock this as 'mock-model').
 */
export const defaultModel: string = GROQ_DEFAULT_MODEL;

/**
 * Explicit model reference for the security-explanation flows
 * (developer-receives-ai-security-explanations.ts + security-explanation-stream.ts).
 *
 * These flows are routed to Groq's fastest available model rather than relying
 * on `defaultModel`, so that adding a slower-but-smarter model as the default
 * for other flows won't accidentally slow down the security-UI critical path.
 */
export const securityExplanationModel: string = GROQ_SECURITY_MODEL;
