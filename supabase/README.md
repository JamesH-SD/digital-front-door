# Supabase migrations

SQL migrations in `migrations/` are applied to the Contactor Supabase project in filename order.

After pulling changes that add migrations, run the new scripts against your database (Supabase SQL editor or CLI) before relying on new columns in the application.
