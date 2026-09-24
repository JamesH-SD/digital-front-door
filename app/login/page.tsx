import LoginForm from "@/components/auth/loginForm";

type PageProps = {
  searchParams?: Promise<{
    returnTo?: string;
    calendar?: string;
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : {};

  return (
    <LoginForm
      returnTo={typeof query.returnTo === "string" ? query.returnTo : undefined}
    />
  );
}
