import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "List active Alpenzo products, optionally filtered by category (e.g. tshirt, sweatshirt, hoodie).",
  inputSchema: {
    category: z.string().optional().describe("Optional category slug to filter by."),
    limit: z.number().int().optional().describe("Max rows to return. Defaults to 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    let q = sb.from("products").select("id,name,description,price,image_url,category,stock").eq("is_active", true);
    if (category) q = q.eq("category", category);
    q = q.limit(Math.min(Math.max(limit ?? 50, 1), 200));
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
