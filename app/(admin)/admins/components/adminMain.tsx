"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import adminAPI, { type AdminItem } from "@/app/services/admin/adminAPI";
import { getStoredAdmin } from "@/app/lib/adminStorage";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import AdminCreateModal from "./adminAction/adminFormModal";
import AdminFilter from "./adminFilter";
import AdminTable from "./adminTable";

type AdminListApiResult =
  | {
      success?: boolean;
      data?: AdminItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

export default function AdminMain() {
  const { withLoading } = useLoading();
  const { canAdd, canEdit, canDelete } = useTabPermission("admins");
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await adminAPI.getAdminAll()) as AdminListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch admins";
        await popup.error("Error", message);
        setAdmins([]);
        return;
      }

      setAdmins(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch admins");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  const filteredAdmins = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const roleFilter = role.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesRole =
        !roleFilter ||
        String(admin.role || "").trim().toLowerCase() === roleFilter;

      if (!keyword) {
        return matchesRole;
      }

      const displayName = String(admin.display_name || "").toLowerCase();
      const email = String(admin.email || "").toLowerCase();
      const matchesSearch =
        displayName.includes(keyword) || email.includes(keyword);

      return matchesRole && matchesSearch;
    });
  }, [admins, role, search]);

  const handleClearFilter = () => {
    setSearch("");
    setRole("");
  };

  const handleEditAdmin = (admin: AdminItem) => {
    setEditingAdminId(admin.id);
  };

  const handleDeleteAdmin = async (admin: AdminItem) => {
    const currentAdmin = getStoredAdmin();
    if (
      currentAdmin &&
      String(currentAdmin.id) === String(admin.id)
    ) {
      await popup.warning(
        "Cannot delete",
        "You cannot delete your own account"
      );
      return;
    }

    const confirmed = await popup.confirmDelete({
      title: "Delete this admin?",
      text: `Delete ${admin.display_name} (${admin.email})?`,
    });
    if (!confirmed) return;

    let deleted = false;

    await withLoading(async () => {
      const result = (await adminAPI.softDeleteAdmin(admin.id)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Delete failed",
          result?.errMessage || result?.message || "Unable to delete admin"
        );
        return;
      }

      deleted = true;
    }, "Deleting admin...");

    if (!deleted) return;

    void fetchAdmins();
    await popup.success("Deleted successfully", "Admin deleted successfully");
  };

  return (
    <div className="space-y-5">
      <AdminFilter
        search={search}
        role={role}
        onSearchChange={setSearch}
        onRoleChange={setRole}
        onClear={handleClearFilter}
        onAdd={canAdd ? () => setCreateOpen(true) : undefined}
      />

      <AdminTable
        admins={filteredAdmins}
        loading={loading}
        onEdit={canEdit ? handleEditAdmin : undefined}
        onDelete={
          canDelete ? (admin) => void handleDeleteAdmin(admin) : undefined
        }
      />

      {canAdd ? (
        <AdminCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            void fetchAdmins();
          }}
        />
      ) : null}

      {canEdit ? (
        <AdminCreateModal
          open={editingAdminId != null}
          adminId={editingAdminId}
          onClose={() => setEditingAdminId(null)}
          onCreated={() => {
            void fetchAdmins();
          }}
          onUpdated={() => {
            void fetchAdmins();
          }}
        />
      ) : null}
    </div>
  );
}
