"use client";

import { createContext, useContext } from "react";
import type { DeliveryRules } from "@/lib/types";
import { DEFAULT_DELIVERY } from "@/lib/pincode";

// Delivery day ranges and note from Admin → Delivery & charges, for client components.
const Ctx = createContext<DeliveryRules>(DEFAULT_DELIVERY);

export function DeliveryRulesProvider({ rules, children }: { rules: DeliveryRules; children: React.ReactNode }) {
  return <Ctx.Provider value={rules}>{children}</Ctx.Provider>;
}

export const useDeliveryRules = () => useContext(Ctx);
