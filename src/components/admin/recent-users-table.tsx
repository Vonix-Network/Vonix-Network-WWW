"use client";

import { DataTable, type Column } from "@/components/ui/data-table";

type RecentUser = {
  id: number;
  username: string;
  role: string;
  createdAt: string | Date;
};

interface Props {
  users: RecentUser[];
}

export function RecentUsersTable({ users }: Props) {
  const columns: Column<RecentUser>[] = [
    { key: "username", label: "Username", sortable: true },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (user) => (
        <span className="capitalize px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {user.role}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      keyExtractor={(user) => user.id.toString()}
      onRowClick={(user) => (window.location.href = `/admin/users?id=${user.id}`)}
    />
  );
}
