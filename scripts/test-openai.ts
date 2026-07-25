import { config } from "dotenv";
import { checkOpenAIHealth } from "../src/modules/ai/llm-provider";

config({ path: ".env.local" });

async function main() {
  const health = await checkOpenAIHealth();
  console.log("OpenAI health:", JSON.stringify(health, null, 2));

  if (health.status === "quota_exceeded") {
    console.log("\n✓ Fallback automatique activé — l'app utilise le parseur local.");
    console.log("  Rechargez sur: https://platform.openai.com/settings/organization/billing");
    process.exit(0);
  }

  if (health.status === "ok") {
    console.log("\n✓ OpenAI opérationnel");
    process.exit(0);
  }

  console.log("\n✗", health.message);
  process.exit(health.status === "not_configured" ? 0 : 1);
}

main();
