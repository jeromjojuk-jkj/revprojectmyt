import type { StoreProfile } from "@/lib/types";
import { whatsappLink } from "@/lib/storeProfile";

/** Contact details from Admin → Store settings. Shows only what has been filled in. */
export function ContactDetails({ store }: { store: StoreProfile }) {
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (store.supportEmail) rows.push({ label: "Email", value: <a href={`mailto:${store.supportEmail}`}>{store.supportEmail}</a> });
  if (store.supportPhone) rows.push({ label: "Phone", value: <a href={`tel:${store.supportPhone.replace(/[\s-]/g, "")}`}>{store.supportPhone}</a> });
  if (store.whatsapp) rows.push({ label: "WhatsApp", value: <a href={whatsappLink(store.whatsapp)} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a> });
  if (store.supportHours) rows.push({ label: "Support hours", value: store.supportHours });
  if (store.address) rows.push({ label: "Registered address", value: <span className="whitespace-pre-line">{store.address}</span> });
  if (store.legalName) rows.push({ label: "Legal entity", value: store.legalName });
  if (store.gstin) rows.push({ label: "GSTIN", value: store.gstin });
  return (
    <>
      <h2>Ways to reach us</h2>
      {rows.length ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="font-semibold">{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>Support contact details will be listed here shortly.</p>
      )}
      <h2>Grievance officer</h2>
      {store.grievanceName && store.grievanceEmail ? (
        <p>{store.grievanceName} — <a href={`mailto:${store.grievanceEmail}`}>{store.grievanceEmail}</a></p>
      ) : (
        <p>The grievance officer’s name and contact details will be listed here shortly.</p>
      )}
    </>
  );
}
