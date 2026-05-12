export default function UnauthorizedPage() {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-3xl border bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Unauthorized
          </h1>
  
          <p className="mt-2 text-sm text-gray-600">
            You do not have access to this tenant.
          </p>
        </div>
      </main>
    );
  }
