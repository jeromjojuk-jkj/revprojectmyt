/** The shop's public address (SITE_URL in production), without a trailing slash. */
export const siteUrl = () => (process.env.SITE_URL?.trim() || "https://www.kripkart.com").replace(/\/$/, "");
