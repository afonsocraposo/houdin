import { z } from "@/lib/zod";

export const plans = ["free", "plus"] as const;
export const AcccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.url().nullable(),
  plan: z.enum(plans),
  joinedAt: z.string().transform((val) => new Date(val)),
});
export type Account = z.infer<typeof AcccountSchema>;
