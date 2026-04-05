"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDebounce } from "./use-debounce";

interface FetchOptions {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

interface UseDataTableProps<T> {
  initialData: T[];
  initialTotal: number;
  fetchData: (options: FetchOptions) => Promise<{ transactions: T[]; total: number }>;
  initialLimit?: number;
}

export function useDataTable<T>({
  initialData,
  initialTotal,
  fetchData,
  initialLimit = 10,
}: UseDataTableProps<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: string; 
    direction: "asc" | "desc" 
  } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const isInitialMount = useRef(true);

  const loadData = useCallback(async (options: Partial<FetchOptions> = {}) => {
    setIsLoading(true);
    try {
      const fetchOptions: FetchOptions = {
        page: options.page ?? page,
        limit: options.limit ?? limit,
        search: options.search !== undefined ? options.search : debouncedSearch,
        sortBy: options.sortBy ?? sortConfig?.key,
        sortDir: options.sortDir ?? sortConfig?.direction,
      };

      const result = await fetchData(fetchOptions);
      setData(result.transactions);
      setTotal(result.total);
      
      if (options.page) setPage(options.page);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, page, limit, debouncedSearch, sortConfig]);

  // Handle search change
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    loadData({ page: 1, search: debouncedSearch });
  }, [debouncedSearch, loadData]);

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(total / limit);
    if (newPage < 1 || newPage > totalPages || isLoading) return;
    loadData({ page: newPage });
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const newSort = { key, direction };
    setSortConfig(newSort);
    loadData({ page: 1, sortBy: key, sortDir: direction });
  };

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    totalPages,
    limit,
    isLoading,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handlePageChange,
    handleSort,
    refresh: () => loadData(),
  };
}
