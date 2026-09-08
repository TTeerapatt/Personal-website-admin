"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import databaseAPI, {
  type DatabaseItem,
} from "@/app/services/database/databaseAPI";
import allDatabaseAPI, {
  type AllDatabaseItem,
} from "@/app/services/allDatabase/allDatabaseAPI";
import projectAPI, {
  type ProjectItem,
} from "@/app/services/project/projectAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import DatabaseFilter from "./databaseFilter";
import DatabaseTable from "./databaseTable";
import DatabaseFormModal from "./databaseAction/databaseFormModal";

type DatabaseListApiResult =
  | {
      success?: boolean;
      data?: DatabaseItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

type AllDatabaseListApiResult =
  | {
      success?: boolean;
      data?: AllDatabaseItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

type ProjectListApiResult =
  | {
      success?: boolean;
      data?: ProjectItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

export default function DatabaseMain() {
  const { withLoading } = useLoading();
  const { canAdd, canEdit, canDelete } = useTabPermission("database");
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [allDatabases, setAllDatabases] = useState<AllDatabaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [allDatabaseId, setAllDatabaseId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState<DatabaseItem | null>(
    null
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchDatabases = useCallback(async () => {
    setLoading(true);
    try {
      const result =
        (await databaseAPI.getDatabaseAll()) as DatabaseListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch Databases";
        await popup.error("Error", message);
        setDatabases([]);
        return;
      }

      setDatabases(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch Databases");
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const result = (await projectAPI.getProjectAll({
        is_active: true,
      })) as ProjectListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        setProjects([]);
        return;
      }

      setProjects(Array.isArray(result.data) ? result.data : []);
    } catch {
      setProjects([]);
    }
  }, []);

  const fetchAllDatabases = useCallback(async () => {
    try {
      const result =
        (await allDatabaseAPI.getAllDatabaseAll()) as AllDatabaseListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        setAllDatabases([]);
        return;
      }

      setAllDatabases(Array.isArray(result.data) ? result.data : []);
    } catch {
      setAllDatabases([]);
    }
  }, []);

  useEffect(() => {
    void fetchDatabases();
    void fetchProjects();
    void fetchAllDatabases();
  }, [fetchAllDatabases, fetchDatabases, fetchProjects]);

  const filteredDatabases = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const statusFilter = status.trim().toLowerCase();
    const projectFilter = projectId.trim();
    const typeFilter = allDatabaseId.trim();

    return databases.filter((database) => {
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && database.is_active) ||
        (statusFilter === "inactive" && !database.is_active);

      const matchesProject =
        !projectFilter || String(database.project_id) === projectFilter;

      const matchesType =
        !typeFilter || String(database.all_database_id) === typeFilter;

      if (!keyword) return matchesStatus && matchesProject && matchesType;

      const name = String(database.name || "").toLowerCase();
      const description = String(database.description || "").toLowerCase();
      const projectName = String(database.project_name || "").toLowerCase();
      const typeName = String(database.all_database_name || "").toLowerCase();
      const typeCode = String(database.all_database_code || "").toLowerCase();
      const matchesSearch =
        name.includes(keyword) ||
        description.includes(keyword) ||
        projectName.includes(keyword) ||
        typeName.includes(keyword) ||
        typeCode.includes(keyword);

      return matchesStatus && matchesProject && matchesType && matchesSearch;
    });
  }, [allDatabaseId, databases, projectId, search, status]);

  const handleClearFilter = () => {
    setSearch("");
    setStatus("");
    setProjectId("");
    setAllDatabaseId("");
  };

  const handleToggleActive = async (database: DatabaseItem) => {
    const nextActive = !database.is_active;
    setTogglingId(database.id);

    try {
      const result = (await databaseAPI.patchDatabaseIsActive(
        database.id,
        nextActive
      )) as {
        success?: boolean;
        status?: string;
        data?: DatabaseItem;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Status update failed",
          result?.errMessage ||
            result?.message ||
            "Unable to update Database status"
        );
        return;
      }

      const updated = result.data;
      setDatabases((prev) =>
        prev.map((item) =>
          item.id === database.id
            ? updated
              ? updated
              : { ...item, is_active: nextActive }
            : item
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteDatabase = async (database: DatabaseItem) => {
    const confirmed = await popup.confirmDelete({
      title: "Delete this Database?",
      text: `Delete ${database.name}?`,
    });
    if (!confirmed) return;

    let deleted = false;

    await withLoading(async () => {
      const result = (await databaseAPI.softDeleteDatabase(database.id)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Delete failed",
          result?.errMessage || result?.message || "Unable to delete Database"
        );
        return;
      }

      deleted = true;
    }, "Deleting Database...");

    if (!deleted) return;

    void fetchDatabases();
    await popup.success(
      "Deleted successfully",
      "Database deleted successfully"
    );
  };

  return (
    <div className="space-y-5">
      <DatabaseFilter
        search={search}
        status={status}
        projectId={projectId}
        allDatabaseId={allDatabaseId}
        projects={projects}
        allDatabases={allDatabases}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onProjectChange={setProjectId}
        onAllDatabaseChange={setAllDatabaseId}
        onClear={handleClearFilter}
        onAdd={canAdd ? () => setCreateOpen(true) : undefined}
      />

      <DatabaseTable
        databases={filteredDatabases}
        loading={loading}
        togglingId={togglingId}
        onEdit={canEdit ? setEditingDatabase : undefined}
        onDelete={
          canDelete
            ? (database) => void handleDeleteDatabase(database)
            : undefined
        }
        onToggleActive={
          canEdit
            ? (database) => void handleToggleActive(database)
            : undefined
        }
      />

      {canAdd ? (
        <DatabaseFormModal
          open={createOpen}
          projects={projects}
          allDatabases={allDatabases}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            void fetchDatabases();
          }}
        />
      ) : null}

      {canEdit ? (
        <DatabaseFormModal
          open={editingDatabase != null}
          database={editingDatabase}
          projects={projects}
          allDatabases={allDatabases}
          onClose={() => setEditingDatabase(null)}
          onSaved={() => {
            void fetchDatabases();
          }}
        />
      ) : null}
    </div>
  );
}
