import { logout } from "@/app/auth/logout/actions";

type Props = {
  email: string;
};

export default function UserMenu({ email }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-gray-900">
          {email}
        </p>

        <p className="text-xs text-gray-500">
          Signed in
        </p>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Logout
        </button>
      </form>
    </div>
  );
}