import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List the distinct product category slugs available in the Alpenzo catalog.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("products")
      .select("category")
      .eq("is_active", true);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const categories = Array.from(new Set((data ?? []).map((r: { category: string | null }) => r.category).filter(Boolean)));
    return {
      content: [{ type: "text", text: JSON.stringify(categories) }],
      structuredContent: { categories },
    };
  },
});
