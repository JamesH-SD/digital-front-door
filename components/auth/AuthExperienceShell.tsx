import Link from "next/link";
import Image from "next/image";

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

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] flex-col items-center justify-start gap-3 pt-6 sm:justify-center sm:pt-0">
      <Link
        href="/"
        aria-label="Return to Contactor home"
        className="inline-flex flex-col items-center transition"
      >
        <Image
          src="/branding/contactor-logo.png"
          alt="Contactor"
          width={340}
          height={90}
          priority
          className="h-auto w-[250px] sm:w-[320px]"
        />

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-gray-600">
            AI Receptionist
          </span>

          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-gray-600">
            Website
          </span>

          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-gray-600">
            Scheduling
          </span>
        </div>
      </Link>

        <div
          className={`w-full ${maxWidth} rounded-3xl border border-white/80 bg-white/92 p-4 shadow-[0_24px_70px_rgba(17,24,39,0.15)] backdrop-blur sm:p-5`}
        >
          {children}
        </div>
      </div>
    </main>
  );
}