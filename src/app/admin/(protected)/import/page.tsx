import { CSV_COLUMNS, CSV_REQUIRED } from "@/lib/productInput";
import { ImportForm } from "./ImportForm";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">CSV import</h1>
      <div className="rounded-2xl bg-white p-4 text-sm ring-1 ring-line">
        <p>Upload a CSV you prepared from <b>your own supplier data</b>. One row per variant; rows sharing a <code>slug</code> become one product.
          Krip does not scrape or auto-import listings from Amazon, Flipkart, Meesho or other marketplaces.</p>
        <ul className="mt-2 list-disc pl-5 text-xs text-ink-soft">
          <li>Required columns: {CSV_REQUIRED.join(", ")}</li>
          <li>All columns: {CSV_COLUMNS.join(", ")}</li>
          <li><code>image_urls</code> and <code>care</code>: separate multiple values with <code>|</code>. Images must be https:// links you are authorised to use.</li>
          <li>Products import as <b>draft</b> unless <code>status</code> is set. Active products need <code>rights_confirmed=yes</code>.</li>
          <li>Import is all-or-nothing: fix every error in the preview before committing.</li>
        </ul>
        <a href="/admin/import/template" className="mt-2 inline-flex min-h-11 items-center font-semibold text-leaf underline">Download template CSV</a>
      </div>
      <ImportForm />
    </div>
  );
}
