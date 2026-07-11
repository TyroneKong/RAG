"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Table as TanstackTableType,
  useReactTable,
} from "@tanstack/react-table";
import React, { SetStateAction, useState } from "react";

type PaginationType = {
  pageIndex: number;
  pageSize: number;
};

type TableType<TData> = {
  data: TData[] | undefined;
  columns: ColumnDef<TData, any>[];
  pagination?: PaginationType;
  setPagination?: React.Dispatch<SetStateAction<PaginationType>>;
  sorting?: SortingState;
  setSorting?: React.Dispatch<SetStateAction<SortingState>>;
  isManualPagination?: boolean;
  pageSize?: number;
  isLoading?: boolean;
  tableCaption?: string;
  createTable: (table: TanstackTableType<TData>) => void;
  filtering: string;
  setFiltering: React.Dispatch<SetStateAction<string>>;
};

const DataTable = <T,>({
  data,
  isLoading,
  tableCaption,
  createTable,
  filtering,
  setFiltering,
  columns,
}: TableType<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const tableInstance = useReactTable({
    columns,
    data: data || [],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter: filtering,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
  });

  const rowData = () => data && tableInstance.getRowModel().rows;

  const row = rowData();

  if (isLoading) {
    return <div>...loading</div>;
  }

  // const pageCount = tableInstance.getPageCount();

  // const total = row?.length;

  return (
    <div className="flex flex-col ">
      <Table className="w-full ml-4 border-collapse divide-y divide-gray-400 text-xs">
        <TableCaption>{tableCaption}</TableCaption>

        <TableHeader>
          {tableInstance?.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className="text-left cursor-pointer"
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  {{
                    asc: "🔼",
                    desc: "🔽",
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {row?.map((r) => (
            <React.Fragment key={r.id}>
              <TableRow key={r.id}>
                {r.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;
