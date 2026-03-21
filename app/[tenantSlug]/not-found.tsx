export default function TenantNotFound() {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-900">Contractor not found</h1>
          <p className="mt-3 text-sm text-gray-600">
            The page you requested does not exist or is no longer active.
          </p>
        </div>
      </main>
    );
  }