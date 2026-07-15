import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2,
  Users,
  UserCheck,
  Trash2,
  Edit3,
  Shield,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const ROLE_STYLES = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  organizer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  staff: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  volunteer: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  fan: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const ALL_ROLES = ["fan", "volunteer", "staff", "organizer", "admin"];

function EditUserModal({ user, onClose, onSave }) {
  const [role, setRole] = useState(user.role);
  const [assignedZone, setAssignedZone] = useState(user.assignedZone || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-card border border-card-border rounded-2xl p-6 shadow-2xl mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="edit-user-title" className="font-semibold text-white flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-primary" />
            Edit User: {user.name}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-background transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary capitalize"
              aria-label="Select user role"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Assigned Zone (optional)</label>
            <Input
              value={assignedZone}
              onChange={(e) => setAssignedZone(e.target.value)}
              placeholder="e.g. Z-North"
              className="bg-background border-border text-white"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 border-card-border" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => onSave({ role, assignedZone: assignedZone || null })}
          >
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.users,
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }) => adminApi.updateUser(userId, data),
    onSuccess: () => {
      qc.invalidateQueries(["admin-users"]);
      toast({ title: "User updated successfully" });
      setEditUser(null);
    },
    onError: (err) => toast({ title: err?.error || "Update failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      qc.invalidateQueries(["admin-users"]);
      toast({ title: "User deleted" });
    },
    onError: (err) => toast({ title: err?.error || "Delete failed", variant: "destructive" }),
  });

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = ALL_ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, roles, and venue configuration
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-card border border-card-border px-3 py-1.5 rounded-full">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">{users.length} total users</span>
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {ALL_ROLES.map((r) => (
          <motion.div
            key={r}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-card border border-card-border text-center"
          >
            <p className="text-2xl font-bold text-white">{roleCounts[r] ?? 0}</p>
            <p className={`text-xs capitalize font-medium mt-0.5 ${ROLE_STYLES[r]?.split(" ")[1] || "text-muted-foreground"}`}>{r}s</p>
          </motion.div>
        ))}
      </div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-card border border-card-border"
      >
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-semibold text-white">User Management</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="pl-9 bg-background border-border text-white w-64"
              aria-label="Search users"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Users table">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="pb-3 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="pb-3 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Zone</th>
                <th className="pb-3 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="py-3">
                      <div className="h-8 rounded bg-background animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => (
                  <motion.tr
                    key={user.id || user._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 last:border-0 hover:bg-background/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white leading-none">{user.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={`text-xs capitalize ${ROLE_STYLES[user.role] || ""}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <span className="text-muted-foreground text-xs">
                        {user.assignedZone || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <span className="text-muted-foreground text-xs">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => setEditUser(user)}
                          aria-label={`Edit ${user.name}`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (window.confirm(`Delete user ${user.name}?`)) {
                              deleteMutation.mutate(user.id || user._id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          aria-label={`Delete ${user.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={(data) => updateMutation.mutate({ userId: editUser.id || editUser._id, data })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
