import Link from "next/link";

type Props = {
  children: React.ReactNode;
  maxWidth?: string;
};

export default function AuthExperienceShell({
  children,
  maxWidth = "max-w-lg",
}: Props) {
  return (
    <main className="relative min-h-screen overflow-y-auto bg-[#f8f7f4] px-4 py-8">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(194,65,12,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(85,107,47,0.14),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(15,23,42,0.10),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8f7f4_48%,#f1eee8_100%)]" />

      <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 text-center">
      <Link
        href="/"
        aria-label="Return to Contactor home"
        className="pointer-events-auto inline-flex flex-col items-center rounded-3xl px-4 py-2 transition hover:bg-white/45"
      >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-700 text-lg font-bold text-white shadow-sm">
            C
          </span>

          <span className="mt-3 text-sm font-bold text-gray-950">
            Contactor
          </span>

          <span className="mt-1 text-xs font-medium text-gray-500">
            AI receptionist • Website • Scheduling
          </span>
        </Link>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-0 hidden justify-center md:flex">
        <div className="grid w-full max-w-2xl grid-cols-3 gap-3 px-5 text-xs font-semibold text-gray-600">
          <div className="rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-center shadow-sm backdrop-blur">
            $49.99/month
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-center shadow-sm backdrop-blur">
            7-day free trial
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-center shadow-sm backdrop-blur">
            No hidden fees
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center pt-20 md:pt-16">
        <div
          className={`w-full ${maxWidth} rounded-4xl border border-white/80 bg-white/92 p-5 shadow-[0_30px_90px_rgba(17,24,39,0.18)] backdrop-blur sm:p-6`}
        >
          {children}
        </div>
      </div>
    </main>
  );
}