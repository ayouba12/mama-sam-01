# Supabase Backend Setup Guide · Mama Sam Supermarket

This guide provides step-by-step instructions to configure your Supabase backend for the Mama Sam African & Caribbean Supermarket web application.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project**.
3. Choose a name (e.g. `mama-sam-supermarket`), enter a strong database password, and select your closest region (e.g. `Frankfurt (eu-central-1)` or `Milan (eu-south-1)`).
4. Once the project finishes provisioning, open the project dashboard.

---

## 2. Run Database Migrations

1. In the Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Copy the entire contents of `supabase/schema.sql` and paste it into the editor.
4. Click **Run** (or `Ctrl+Enter` / `Cmd+Enter`).
   * This creates all tables: `user_roles`, `categories`, `products`, `orders`, `order_items`, `store_settings`.
   * It creates the storage bucket: `product-images`.
   * It enables Row Level Security (RLS) on all tables and storage objects with secure policies.
5. Create another **New query**, paste the contents of `supabase/seed.sql`, and click **Run**.
   * This pre-populates all 28+ Mama Sam products, categories, and store configurations.

---

## 3. Create Administrator User

1. In the Supabase Dashboard, click on **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter your administrator email (e.g., `admin@mamasam.it` or your work email) and choose a secure password.
4. Set **Auto Confirm User?** to **Yes** (or confirm via email).
5. Copy the newly created user's **User UID** (a UUID string like `d3b07384-d113-4674-8842-bc0a31f13b63`).
6. Go back to the **SQL Editor**, create a **New query**, and link the user to the administrator role:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_UID_HERE', 'admin')
   ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
   ```
7. Click **Run**. This user now has full administrator permissions.

---

## 4. Configure Storage Bucket

The `product-images` bucket is automatically provisioned and configured as a public bucket with 8MB size limits by `supabase/schema.sql`.

To verify:
1. In the Supabase Dashboard, click **Storage**.
2. Verify that the bucket `product-images` appears with the **Public** badge.
3. Under **Policies**, ensure that anonymous users have `SELECT` permissions, and authenticated admins have `INSERT`, `UPDATE`, and `DELETE` permissions.

---

## 5. Configure Environment Variables

Retrieve your API keys from **Project Settings** > **API**:
- **Project URL**: Found under *Project URL*.
- **anon / public key**: Found under *Project API keys*.
- **service_role key**: Found under *Project API keys* (Keep this secret! Never put this in frontend code).

Add the following variables to your environment (in `.env` or your deployment platform configuration):

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." # Server-side only
```

---

## 6. Verification Checklist

- [ ] `supabase/schema.sql` executed without errors.
- [ ] `supabase/seed.sql` executed and populated products.
- [ ] Admin account created in Supabase Auth and linked in `user_roles`.
- [ ] Environment variables configured.
- [ ] Visit `/#admin` on the website and log in using the administrator email and password.
- [ ] Create a test order and verify that it appears in the Admin Orders dashboard.
- [ ] Upload a test product photo and verify that it uploads to the `product-images` bucket.
