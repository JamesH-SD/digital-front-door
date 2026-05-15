import Link from "next/link";

const demoTenants = [
  { slug: "hughes-general", name: "Hughes General" },
  { slug: "elite-electric", name: "Elite Electric" },
  { slug: "pete-s-pet-grooming", name: "Pete's Pet Grooming" },
  { slug: "christian-s-trailer-rentals", name: "Christian's Trailer Rentals" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight">Digital Front Door</h1>
        <p className="mt-4 text-gray-600">
          Demo tenant pages for contractor landing experiences.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {demoTenants.map((tenant) => (
            <Link
              key={tenant.slug}
              href={`/${tenant.slug}`}
              className="rounded-2xl border p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold">{tenant.name}</h2>
              <p className="mt-2 text-sm text-gray-600">Open demo page</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}