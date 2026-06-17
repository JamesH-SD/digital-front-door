import Link from "next/link";

type Props = {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
};

export default function LegalPageShell({ title, updatedAt, children }: Props) {
  return (
    <main className="saas-shell min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          ← Back to Home
        </Link>

        <article className="saas-card mt-6 p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            Contactor Legal
          </p>

          <h1 className="mt-3 text-3xl font-bold text-gray-950">{title}</h1>

          <p className="mt-2 text-sm text-gray-500">Last updated: {updatedAt}</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-gray-700">
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-950">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}