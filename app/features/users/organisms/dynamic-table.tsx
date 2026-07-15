// components/dynamic-table.tsx
"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

const DynamicTable = ({ data }: { data: any }) => {
  const rows = useMemo<any[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    return Object.keys(rows[0]).map((key) => ({
      accessorKey: key,
      header: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }, [rows]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!Array.isArray(data)) {
    return (
      <pre className="text-xs text-red-400 whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 p-3">No rows returned.</div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-800 rounded-lg">
      <table className="w-full text-left text-xs font-mono">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-slate-800 bg-slate-900"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 font-semibold text-slate-400"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-900 hover:bg-slate-900/40"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3 truncate max-w-[200px]">
                  {String(cell.getValue() ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicTable;
