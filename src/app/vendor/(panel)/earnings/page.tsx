import { redirect } from "next/navigation";

/** Old address; earnings now live in the wallet. */
export default function Earnings() {
  redirect("/vendor/wallet");
}
