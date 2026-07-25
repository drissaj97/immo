import { config } from "dotenv";
import { createLLMProvider } from "../src/modules/ai/llm-provider";

config({ path: ".env.local" });

async function main() {
  const provider = createLLMProvider();
  console.log("Provider:", provider.name);
  if (provider.name !== "openai") {
    console.error("AI_PROVIDER must be openai with OPENAI_API_KEY set");
    process.exit(1);
  }
  const text = await provider.complete(
    [{ role: "user", content: "Dis bonjour en une phrase pour tester DarBladi." }],
    { maxTokens: 60 },
  );
  console.log("OpenAI OK:", text.slice(0, 150));
}

main().catch((e) => {
  console.error("OpenAI failed:", e.message);
  process.exit(1);
});
