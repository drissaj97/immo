import { z } from "zod";
import type { SearchFilters } from "@/modules/search/natural-language-parser";

export const assistantResponseSchema = z.object({
  reply: z.string(),
  intent: z.enum(["search", "explain", "compare", "invest", "general"]).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  assumptions: z.array(z.string()).optional(),
  missing: z.array(z.string()).optional(),
  citations: z.array(
    z.object({
      source: z.string(),
      type: z.enum(["fact", "calculation", "estimate", "hypothesis", "recommendation"]),
      label: z.string(),
    }),
  ).optional(),
  listings: z.array(z.object({
    id: z.string(),
    title: z.string(),
    price: z.number(),
    city: z.string(),
    slug: z.string(),
  })).optional(),
});

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMOptions = {
  maxTokens?: number;
  temperature?: number;
};

export interface LLMProvider {
  readonly name: string;
  complete(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
}

export type ToolContext = {
  locale: string;
};

export type ControlledToolResult = {
  tool: string;
  data: unknown;
  source: string;
};

export type SearchFiltersPartial = SearchFilters;
