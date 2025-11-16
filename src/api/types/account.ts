import * as z from "zod";

export const Account = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean().default(false),
  image: z.url().optional(),
  plan: z.enum(["free", "plus"]).default("free"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Account = z.infer<typeof Account>;
