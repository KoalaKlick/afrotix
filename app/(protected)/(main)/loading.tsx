import { Skeleton } from "@/components/ui/skeleton";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default function ProtectedMainLoading() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1 text-muted-foreground" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        <Skeleton className="h-4 w-24" />
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96 max-w-full" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {["stats-a", "stats-b", "stats-c", "stats-d"].map((itemKey) => (
                            <Card key={itemKey}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="mb-2 h-8 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="mt-4 flex-1 border-none shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-8 w-24 rounded-md" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {["row-a", "row-b", "row-c", "row-d", "row-e", "row-f"].map((itemKey) => (
                                    <div key={itemKey} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-40" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="hidden h-4 w-24 sm:block" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}