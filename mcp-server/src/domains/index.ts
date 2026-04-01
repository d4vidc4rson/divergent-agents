import { DomainConfig } from "./types.js";
import product from "./product.js";
import strategy from "./strategy.js";

// ---------------------------------------------------------------------------
// Domain registry — add new domains here
// ---------------------------------------------------------------------------

export const DOMAINS: Record<string, DomainConfig> = {
  product,
  strategy,
};

export { DomainConfig } from "./types.js";
