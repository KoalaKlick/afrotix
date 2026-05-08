"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDataTable } from "@/lib/hooks/use-data-table";
import { formatAmount } from "@/lib/utils";

interface NominationTransaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  email: string;
  status: string;
  nomineeName: string;
  nomineeCode?: string;
  createdAt: string;
}

interface NominationTransactionsTableProps {
  readonly initialData: {
    transactions: NominationTransaction[];
    total: number;
  };
  readonly eventId: string;
  readonly fetchPage: (options: {
    page: number;
    limit: number;
    search?: string;
  }) => Promise<{ transactions: NominationTransaction[]; total: number }>;
}

export function NominationTransactionsTable({
  initialData,
  fetchPage,
  eventId,
}: NominationTransactionsTableProps) {
  const {
    data,
    total,
    page,
    totalPages,
    isLoading,
    searchQuery,
    setSearchQuery,
    handlePageChange,
  } = useDataTable<NominationTransaction>({
    initialData: initialData.transactions,
    initialTotal: initialData.total,
    fetchData: fetchPage,
  });

  return (
    <div className="space-y-4 px-0">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search nominee or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground shrink-0">
          {total} nomination{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="relative rounded-lg border overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-semibold">Nominee</TableHead>
              <TableHead className="text-xs font-semibold">Code</TableHead>
              <TableHead className="text-xs font-semibold">
                Nominator Email
              </TableHead>
              <TableHead className="text-xs font-semibold text-right">
                Fee
              </TableHead>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  No nomination transactions found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="text-sm">
                  <TableCell className="font-medium">
                    {row.nomineeName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.nomineeCode ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.email}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatAmount(row.amount)}
                    <span
                      className="hidden opacity-0"
                      aria-hidden="true"
                      title={eventId}
                    ></span>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(row.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={row.status as any} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
