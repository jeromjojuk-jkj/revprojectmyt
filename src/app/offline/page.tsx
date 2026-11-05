import { Logo } from "@/components/Logo";
import { RetryButton } from "./RetryButton";

// Shown by the service worker when there is no connection. Kept static (no data reads)
// so it can be saved on the phone when the app is installed.
export const dynamic = "force-static";
export const metadata = { title: "You’re offline", robots: { index: false } };

export default function Offline() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
      <div className="max-w-sm">
        <Logo className="text-[40px]" />
        <h1 className="mt-6 text-2xl font-bold">You’re offline</h1>
        <p className="mt-2 text-ink-soft">Check your internet connection and try again. Your bag and wishlist are saved on this phone.</p>
        <RetryButton />
      </div>
    </main>
  );
}
