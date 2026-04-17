import { requireAdmin } from "@/lib/auth";
import { listUsers } from "./actions";
import AdminUsersManager from "@/components/admin-users-manager";

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const users = await listUsers();
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Create accounts and assign roles. Admins have full access; viewers are read-only.
        </p>
      </div>
      <AdminUsersManager users={users} currentUserId={me.id} />
    </div>
  );
}
