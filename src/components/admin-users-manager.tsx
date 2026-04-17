"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, KeyRound } from "lucide-react";
import { formatDate } from "@/lib/format";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  setUserRole,
  type AdminUser,
} from "@/app/admin/users/actions";
import type { Role } from "@/lib/auth";

export default function AdminUsersManager({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" /> New user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateUserForm onDone={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="w-40">Role</TableHead>
                <TableHead className="w-40">Last sign-in</TableHead>
                <TableHead className="w-40">Created</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isSelf={u.id === currentUserId}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);

  function changeRole(role: Role) {
    if (role === user.role) return;
    startTransition(async () => {
      try {
        await setUserRole(user.id, role);
        toast.success(`Role updated to ${role}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  function remove() {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteUser(user.id);
        toast.success("User deleted");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.email}
        {isSelf ? (
          <Badge variant="outline" className="ml-2 text-xs">
            you
          </Badge>
        ) : null}
      </TableCell>
      <TableCell>
        <Select
          value={user.role}
          onValueChange={(v) => changeRole(v as Role)}
          disabled={pending || isSelf}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {user.lastSignInAt ? formatDate(user.lastSignInAt) : "Never"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" title="Reset password">
                <KeyRound className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ResetPasswordForm
                user={user}
                onDone={() => setResetOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Button
            size="icon"
            variant="ghost"
            disabled={pending || isSelf}
            onClick={remove}
            title={isSelf ? "Cannot delete yourself" : "Delete"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{ email: string; password: string; role: Role }>({
    email: "",
    password: "",
    role: "viewer",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createUser(form);
        toast.success(`Created ${form.email}`);
        onDone();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>New user</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Initial password *</Label>
          <Input
            type="text"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
          <p className="text-xs text-muted-foreground">
            Share this with the user. They should change it after first sign-in.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Role *</Label>
          <Select
            value={form.role}
            onValueChange={(v) => setForm({ ...form, role: v as Role })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer (read-only)</SelectItem>
              <SelectItem value="admin">Admin (full access)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ResetPasswordForm({
  user,
  onDone,
}: {
  user: AdminUser;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await resetUserPassword(user.id, password);
        toast.success(`Password reset for ${user.email}`);
        setPassword("");
        onDone();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Reset failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Reset password</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Set a new password for <span className="font-medium">{user.email}</span>.
        </p>
        <div className="space-y-1.5">
          <Label>New password *</Label>
          <Input
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Reset password"}
        </Button>
      </DialogFooter>
    </form>
  );
}
