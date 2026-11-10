import type { VendorStatus } from "@/lib/types";
import type { Tone } from "@/app/admin/_components/ui";

export const STATUS: Record<VendorStatus, [string, Tone]> = {
  pending_payment: ["Fee not paid", "neutral"], pending_review: ["Needs review", "yellow"], approved: ["Approved", "green"], rejected: ["Rejected", "red"], suspended: ["Suspended", "red"],
};
