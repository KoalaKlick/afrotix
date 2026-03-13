"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export interface BreadcrumbItemConfig {
    label: ReactNode;
    href?: string;
    className?: string;
}

interface PageHeaderProps {
    readonly breadcrumbs?: BreadcrumbItemConfig[];
    readonly actions?: ReactNode;
}

export function PageHeader({ breadcrumbs = [], actions }: PageHeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center z-20 w-full  bg-white gap-2 fixed top-px transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                />
                {breadcrumbs.length > 0 && (
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((item, index) => {
                                const isLast = index === breadcrumbs.length - 1;
                                const key = typeof item.label === "string" ? item.label : index;
                                return (
                                    <Fragment key={key}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage className={item.className}>
                                                    {item.label}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={item.href}>
                                                    {item.label}
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator />}
                                    </Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>
            {actions && <div className="ml-auto pr-4">{actions}</div>}
        </header>
    );
}
