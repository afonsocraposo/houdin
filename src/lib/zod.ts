// zod.ts
import { z } from "zod";

// Fix CSP eval issue with Zod: https://github.com/colinhacks/zod/issues/4461
// This configuration MUST be applied before any Zod schemas are created and need to be imported in EVERY file that uses Zod.
z.config({ jitless: true });

// Re-export z with the configuration applied
export { z };
