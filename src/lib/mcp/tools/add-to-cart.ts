import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_to_cart",
  title: "Add to cart",
  description: "Add a product to the signed-in user's cart.",
  inputSchema: {
    product_id: z.string().describe("Product id (uuid) to add."),
    quantity: z.number().int().optional().describe("Quantity to add. Defaults to 1."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ product_id, quantity }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const qty = Math.max(1, Math.min(quantity ?? 1, 999));
    const { data, error } = await supabaseForUser(ctx)
      .from("cart_items")
      .insert({ user_id: ctx.getUserId(), product_id, quantity: qty })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { item: data } };
  },
});
