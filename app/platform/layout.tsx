import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPlatformAdminRole } from "@/lib/auth/platformAccess";

export default async function ContactorAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const platformRole = await getPlatformAdminRole(user.id);

  if (!platformRole) redirect("/unauthorized");

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/platform" className="font-bold text-gray-950">
            Contactor Admin
          </Link>

          <nav className="flex items-center gap-5 text-sm font-semibold text-gray-600">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-700"
          >
            Marketing Site ↗
          </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </main>
  );
}