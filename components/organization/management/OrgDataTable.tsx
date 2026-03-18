import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export interface Column<T> {
    header: string;
    cell: (row: T) => ReactNode;
    className?: string;
}

interface OrgDataTableProps<T> {
    readonly icon: ReactNode;
    readonly title: string;
    readonly columns: Column<T>[];
    readonly data: T[];
    readonly keyExtractor: (row: T) => string;
    readonly headerAction?: ReactNode;
    readonly emptyState?: ReactNode;
}

export function OrgDataTable<T>({
    icon,
    title,
    columns,
    data,
    keyExtractor,
    headerAction,
    emptyState,
}: OrgDataTableProps<T>) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    {icon}
                    {title}
                </CardTitle>
                {headerAction}
            </CardHeader>
            <CardContent>
                {data.length === 0 && emptyState ? (
                    emptyState
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableHead key={col.header} className={col.className}>
                                        {col.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row) => (
                                <TableRow key={keyExtractor(row)}>
                                    {columns.map((col) => (
                                        <TableCell key={col.header} className={col.className}>
                                            {col.cell(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
