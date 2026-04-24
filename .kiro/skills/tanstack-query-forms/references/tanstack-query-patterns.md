# TanStack Query v5 + React Hook Form — Advanced Patterns Reference

## Purpose

This document provides advanced patterns, recipes, and architectural guidance for TanStack Query v5 and React Hook Form implementations. Load this document on-demand when implementing complex data fetching, cache management, or form scenarios beyond basic CRUD.

## Technology Context

- **TanStack Query**: v5+ (`@tanstack/react-query`)
- **Form Management**: React Hook Form (`react-hook-form`)
- **Schema Validation**: Zod (`zod`)
- **Form Resolver**: `@hookform/resolvers/zod`
- **UI Library**: Fluent UI React v9 (`@fluentui/react-components`)
- **Colors**: Centralized `theme/colors.ts` re-exporting Fluent UI `tokens` + semantic aliases
- **Refs**: All DOM access MUST use `useRef` with explicit types — no selectors, no string refs
- **Language**: TypeScript strict mode

---

## Optimistic Updates

### Pattern: Optimistic list update on delete

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../../api/product.api";
import { productKeys } from "./useProducts";
import type { ProductListResponse } from "../../schemas/product.schemas";

export function useDeleteProductOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      const previousLists = queryClient.getQueriesData<ProductListResponse>({
        queryKey: productKeys.lists(),
      });

      queryClient.setQueriesData<ProductListResponse>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((item) => item.id !== deletedId),
            totalCount: old.totalCount - 1,
          };
        }
      );

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLists) {
        for (const [queryKey, data] of context.previousLists) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

### When to use optimistic updates

| Scenario | Use Optimistic? | Rationale |
|----------|----------------|-----------|
| Delete from list | Yes | Immediate visual feedback, easy rollback |
| Toggle boolean (active/inactive) | Yes | Single field change, predictable outcome |
| Create new item | No | Server assigns ID and computed fields |
| Complex multi-field update | No | Prediction accuracy is low |
| Reorder items | Yes | Drag-and-drop needs instant response |

---

## Dependent Queries

### Pattern: Load form defaults from server data

```typescript
import { useQuery } from "@tanstack/react-query";

export function useProductFormDefaults(productId: string | undefined) {
  const productQuery = useProduct(productId);
  const categoriesQuery = useCategories({ enabled: !!productId });

  const isReady = productId
    ? productQuery.isSuccess && categoriesQuery.isSuccess
    : categoriesQuery.isSuccess;

  return {
    product: productQuery.data,
    categories: categoriesQuery.data ?? [],
    isLoading: productId ? productQuery.isLoading || categoriesQuery.isLoading : categoriesQuery.isLoading,
    isError: productQuery.isError || categoriesQuery.isError,
    isReady,
  };
}
```

### Using dependent data in edit forms

```typescript
function EditProductPage({ productId }: { productId: string }) {
  const { product, categories, isLoading, isReady } = useProductFormDefaults(productId);

  if (isLoading) return <Spinner size="large" label="Loading product..." />;
  if (!isReady || !product) return <Text>Product not found</Text>;

  return (
    <ProductForm
      mode="edit"
      productId={productId}
      defaultValues={{
        name: product.name,
        category: product.category,
        price: product.price,
        status: product.status,
        description: product.description ?? "",
      }}
      categories={categories}
    />
  );
}
```

---

## Prefetching

### Prefetch on hover (table row → detail page)

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { fetchProduct } from "../../api/product.api";
import { productKeys } from "./useProducts";

export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(id),
      queryFn: () => fetchProduct(id),
      staleTime: 60_000,
    });
  };
}
```

Usage in a table row:

```typescript
const prefetchProduct = usePrefetchProduct();

<tr
  onMouseEnter={() => prefetchProduct(row.original.id)}
  onClick={() => navigate(`/products/${row.original.id}`)}
>
```

### Prefetch on page navigation

```typescript
function ProductsPage() {
  const queryClient = useQueryClient();
  const { data } = useProducts({ page: 1, pageSize: 25 });

  useEffect(() => {
    if (data && data.pageCount > 1) {
      queryClient.prefetchQuery({
        queryKey: productKeys.list({ page: 2, pageSize: 25 }),
        queryFn: () => fetchProducts({ page: 2, pageSize: 25 }),
      });
    }
  }, [data, queryClient]);
}
```

---

## Infinite Queries — Complete Table Integration

### Overview

This section covers the full infinite scroll data layer: generic hooks, domain hooks, API functions, and Zod schemas for paginated responses. The table component that consumes these hooks is defined in the `tanstack-table-implementation` skill's `references/tanstack-table-patterns.md`.

### Pattern 1: Generic infinite table data hook (cursor-based)

Place at: `hooks/useInfiniteTableData.ts`

```typescript
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

interface PageResponse<TData> {
  items: TData[];
  nextCursor: string | null;
  totalCount: number;
}

interface UseInfiniteTableDataOptions<TData> {
  queryKey: readonly unknown[];
  fetchPage: (cursor: string | null) => Promise<PageResponse<TData>>;
  enabled?: boolean;
  staleTime?: number;
}

export function useInfiniteTableData<TData>({
  queryKey,
  fetchPage,
  enabled = true,
  staleTime = 30_000,
}: UseInfiniteTableDataOptions<TData>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime,
  });

  const flatData = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const fetchedCount = flatData.length;

  return {
    ...query,
    flatData,
    totalCount,
    fetchedCount,
  };
}
```

### Pattern 2: Generic infinite table data hook (offset-based)

Place at: `hooks/useInfiniteOffsetData.ts`

```typescript
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

interface OffsetPageResponse<TData> {
  items: TData[];
  totalCount: number;
}

interface UseInfiniteOffsetDataOptions<TData> {
  queryKey: readonly unknown[];
  fetchPage: (offset: number, limit: number) => Promise<OffsetPageResponse<TData>>;
  limit?: number;
  enabled?: boolean;
  staleTime?: number;
}

export function useInfiniteOffsetData<TData>({
  queryKey,
  fetchPage,
  limit = 50,
  enabled = true,
  staleTime = 30_000,
}: UseInfiniteOffsetDataOptions<TData>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam, limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return fetched < lastPage.totalCount ? fetched : undefined;
    },
    enabled,
    staleTime,
  });

  const flatData = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const fetchedCount = flatData.length;

  return {
    ...query,
    flatData,
    totalCount,
    fetchedCount,
  };
}
```

### Pattern 3: Zod schema for paginated API responses

```typescript
import { z } from "zod";
import { productSchema } from "./product.schemas";

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    totalCount: z.number(),
  });

export const paginatedProductResponseSchema = paginatedResponseSchema(productSchema);
export type PaginatedProductResponse = z.infer<typeof paginatedProductResponseSchema>;
```

### Pattern 4: API function for paginated endpoint

```typescript
import { z } from "zod";
import { paginatedProductResponseSchema } from "../../schemas/product.schemas";
import { ApiError } from "./base.api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export async function getProducts(params: {
  cursor?: string | null;
  limit: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  category?: string;
  status?: string;
}): Promise<z.infer<typeof paginatedProductResponseSchema>> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.sortField) searchParams.set("sortField", params.sortField);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.category) searchParams.set("category", params.category);
  if (params.status) searchParams.set("status", params.status);

  const response = await fetch(`${API_BASE}/products?${searchParams}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      errorBody?.message ?? `Request failed with status ${response.status}`,
      errorBody?.errors,
    );
  }
  return paginatedProductResponseSchema.parse(await response.json());
}
```

### Pattern 5: Domain-specific infinite query hook

```typescript
import { useInfiniteTableData } from "../useInfiniteTableData";
import { getProducts } from "../../api/product.api";
import { productKeys } from "./useProducts";
import type { Product } from "../../schemas/product.schemas";

interface UseProductInfiniteListOptions {
  category?: string;
  status?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export function useProductInfiniteList(options: UseProductInfiniteListOptions = {}) {
  return useInfiniteTableData<Product>({
    queryKey: productKeys.list(options),
    fetchPage: (cursor) =>
      getProducts({ cursor, limit: 50, ...options }),
    staleTime: 30_000,
  });
}
```

### Pattern 6: Infinite scroll with server-side sort + filter reset

When sort or filter params change, the query key changes, which causes TanStack Query to refetch from page 1 automatically. Combine with debounced filters:

```typescript
import { useState, useMemo, useEffect, useRef } from "react";
import type { SortingState } from "@tanstack/react-table";
import { useInfiniteTableData } from "../useInfiniteTableData";
import { getProducts } from "../../api/product.api";
import { productKeys } from "./useProducts";
import type { Product } from "../../schemas/product.schemas";

export function useSortableFilteredInfiniteProducts() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters]);

  const sortField = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const queryParams = useMemo(
    () => ({ sortField, sortOrder, ...debouncedFilters }),
    [sortField, sortOrder, debouncedFilters],
  );

  const query = useInfiniteTableData<Product>({
    queryKey: productKeys.list(queryParams),
    fetchPage: (cursor) =>
      getProducts({ cursor, limit: 50, ...queryParams }),
    staleTime: 30_000,
  });

  return {
    ...query,
    sorting,
    setSorting,
    filters,
    setFilters,
  };
}
```

### Pattern 7: IntersectionObserver hook (reusable)

A reusable hook for the infinite scroll sentinel pattern. All refs use `useRef`:

```typescript
import { useRef, useEffect, useCallback } from "react";

interface UseIntersectionObserverOptions {
  root?: React.RefObject<HTMLElement | null>;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
}

export function useIntersectionObserver(
  onIntersect: () => void,
  options: UseIntersectionObserverOptions = {},
) {
  const { root, rootMargin = "300px", threshold = 0, enabled = true } = options;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          callbackRef.current();
        }
      },
      {
        root: root?.current ?? null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, enabled]);

  return sentinelRef;
}
```

Usage in the table component:

```typescript
const scrollRef = useRef<HTMLDivElement>(null);

const sentinelRef = useIntersectionObserver(
  () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  },
  { root: scrollRef, enabled: hasNextPage && !isFetchingNextPage },
);
```

### Pattern 8: Cache invalidation for infinite queries

Mutations must invalidate infinite query keys. Ensure the key factory includes infinite lists:

```typescript
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};
```

Because `useInfiniteTableData` uses `productKeys.list(options)` and regular list queries also use `productKeys.list(filters)`, invalidating `productKeys.lists()` automatically covers both regular and infinite queries.

```typescript
export function useCreateProduct(options: UseCreateProductOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductFormInput) => createProduct(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      options.onSuccess?.(data);
    },
  });
}
```

### Infinite query rules

| Rule | Requirement |
|------|------------|
| Generic hook | Use `useInfiniteTableData<TData>` for cursor-based, `useInfiniteOffsetData<TData>` for offset-based |
| Flat data | Always `useMemo` — never inline `flatMap` in the render |
| Stale time | Minimum 30s for list data — never `staleTime: 0` |
| Zod validation | Every paginated response MUST be validated through a Zod schema |
| Key factory | Infinite list queries use the same key factory prefix as regular lists — invalidating `lists()` covers both |
| Sort/filter reset | When params change, the query key changes, causing TanStack Query to refetch from page 1 |
| Debounce ref | Use `useRef` for debounce timers — never bare `setTimeout` without cleanup |
| Observer root | Always `root: scrollRef` (pass the `RefObject`, not `.current`) — the hook accesses `.current` internally; never use `null`/window |
| Sentinel ref | `useRef<HTMLDivElement>(null)` — IntersectionObserver observes this element |
| Fetch guard | Always `hasNextPage && !isFetchingNextPage` before `fetchNextPage()` |
| Reusable observer | Extract `useIntersectionObserver` as a reusable hook when multiple pages need infinite scroll |
| Colors | All colors from `theme/colors.ts` or `tokens` — never hardcoded |

---

## Polling / Real-Time Data

### Pattern: Polling query

```typescript
export function useActiveOrders(enabled = true) {
  return useQuery({
    queryKey: orderKeys.list({ status: "active" }),
    queryFn: () => fetchOrders({ status: "active" }),
    enabled,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| `refetchInterval` | 10s–30s | Balance between freshness and API load |
| `refetchIntervalInBackground` | `false` | Don't poll when tab is not visible |

---

## Multi-Step Form Pattern

### Zod schemas per step

```typescript
export const stepOneSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
});

export const stepTwoSchema = z.object({
  price: z.number().nonnegative(),
  status: z.enum(["active", "inactive", "draft"]),
});

export const stepThreeSchema = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const fullProductSchema = stepOneSchema.merge(stepTwoSchema).merge(stepThreeSchema);

export type StepOneInput = z.infer<typeof stepOneSchema>;
export type StepTwoInput = z.infer<typeof stepTwoSchema>;
export type StepThreeInput = z.infer<typeof stepThreeSchema>;
export type FullProductInput = z.infer<typeof fullProductSchema>;
```

### Multi-step form hook

```typescript
import { useState, useCallback } from "react";
import { useForm, type DefaultValues, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";

interface UseMultiStepFormOptions<T extends Record<string, unknown>> {
  steps: { schema: ZodSchema; fields: (keyof T & string)[] }[];
  defaultValues: DefaultValues<T>;
  onSubmit: (data: T) => Promise<void>;
}

export function useMultiStepForm<T extends Record<string, unknown>>({
  steps,
  defaultValues,
  onSubmit,
}: UseMultiStepFormOptions<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length;

  const form = useForm<T>({
    resolver: zodResolver(steps[currentStep].schema),
    defaultValues,
    mode: "onBlur",
  });

  const goToNext = useCallback(async () => {
    const currentFields = steps[currentStep].fields;
    const isValid = await form.trigger(currentFields);
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, form, steps, totalSteps]);

  const goToPrevious = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const formErrors: Record<string, string | undefined> = {};
  for (const [key, error] of Object.entries(form.formState.errors)) {
    const fieldError = error as FieldError | undefined;
    formErrors[key] = fieldError?.message;
  }

  return {
    form,
    values: form.watch(),
    formErrors,
    currentStep,
    totalSteps,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    goToNext,
    goToPrevious,
    onSubmit: handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
}
```

---

## Zod Schema Composition Patterns

### Shared field schemas

```typescript
const nameField = z.string().min(1, "Name is required").max(200, "Name must be 200 characters or fewer");
const emailField = z.string().email("Invalid email address");
const phoneField = z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number").optional();

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
});
```

### Conditional validation

```typescript
export const orderSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("delivery"),
    address: z.string().min(1, "Delivery address is required"),
    deliveryDate: z.string().datetime("Invalid date"),
  }),
  z.object({
    type: z.literal("pickup"),
    pickupTime: z.string().datetime("Invalid time"),
  }),
]);
```

### Refinements for cross-field validation

```typescript
export const dateRangeSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });
```

---

## Form Field Array Pattern

### Dynamic field arrays with React Hook Form

```typescript
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { makeStyles, Button, Input, tokens } from "@fluentui/react-components";
import { Add20Regular, Delete20Regular } from "@fluentui/react-icons";
import { FormField } from "../shared/FormField";

interface IngredientsFieldProps {
  form: UseFormReturn<RecipeFormInput>;
  formErrors: Record<string, string | undefined>;
  isSubmitting: boolean;
}

const useFieldArrayStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
  },
});

export function IngredientsField({ form, formErrors, isSubmitting }: IngredientsFieldProps) {
  const styles = useFieldArrayStyles();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  return (
    <div className={styles.root}>
      {fields.map((field, index) => (
        <div key={field.id} className={styles.row}>
          <FormField
            label={`Ingredient ${index + 1}`}
            error={formErrors[`ingredients.${index}.name`]}
          >
            <Input
              {...form.register(`ingredients.${index}.name`)}
              placeholder="Ingredient name"
              disabled={isSubmitting}
            />
          </FormField>
          <FormField
            label="Quantity"
            error={formErrors[`ingredients.${index}.quantity`]}
          >
            <Input
              type="number"
              {...form.register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
              placeholder="0"
              disabled={isSubmitting}
            />
          </FormField>
          <Button
            appearance="subtle"
            icon={<Delete20Regular />}
            onClick={() => remove(index)}
            disabled={isSubmitting || fields.length <= 1}
            aria-label={`Remove ingredient ${index + 1}`}
          />
        </div>
      ))}
      <Button
        appearance="subtle"
        icon={<Add20Regular />}
        onClick={() => append({ name: "", quantity: 0, unit: "" })}
        disabled={isSubmitting}
      >
        Add Ingredient
      </Button>
    </div>
  );
}
```

### Zod schema for field arrays

```typescript
export const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, "Ingredient name is required"),
        quantity: z.number().positive("Quantity must be positive"),
        unit: z.string().min(1, "Unit is required"),
      })
    )
    .min(1, "At least one ingredient is required"),
});
```

---

## Error Boundary for Query Errors

### Query error boundary component

```typescript
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { makeStyles, Button, Text, tokens } from "@fluentui/react-components";
import { ErrorCircle24Regular } from "@fluentui/react-icons";

const useErrorBoundaryStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalXXXL} ${tokens.spacingHorizontalXL}`,
    textAlign: "center",
    color: tokens.colorNeutralForeground2,
  },
});

function QueryFallback({ error, resetErrorBoundary }: FallbackProps) {
  const styles = useErrorBoundaryStyles();

  return (
    <div className={styles.root}>
      <ErrorCircle24Regular aria-hidden="true" />
      <Text weight="semibold" size={400}>Something went wrong</Text>
      <Text size={300}>{error.message}</Text>
      <Button appearance="primary" onClick={resetErrorBoundary}>
        Try Again
      </Button>
    </div>
  );
}

export function QueryBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={QueryFallback}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

Use with `throwOnError: true` in the query:

```typescript
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    throwOnError: true,
  });
}
```

---

## Mutation Queue Pattern

### Sequential mutations

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; data: Partial<ProductFormInput> }[]) => {
      const results = [];
      for (const update of updates) {
        const result = await updateProduct(update.id, update.data);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
```

---

## URL State Synchronization

### Sync query params with table state

```typescript
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

function parseSortOrder(value: string | null): "asc" | "desc" | undefined {
  if (value === "asc" || value === "desc") return value;
  return undefined;
}

export function useTableSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => ({
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 25),
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortOrder: parseSortOrder(searchParams.get("sortOrder")),
    search: searchParams.get("search") ?? undefined,
  }), [searchParams]);

  const setParams = (newParams: Partial<typeof params>) => {
    const updated = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(newParams)) {
      if (value !== undefined && value !== null && value !== "") {
        updated.set(key, String(value));
      } else {
        updated.delete(key);
      }
    }
    setSearchParams(updated, { replace: true });
  };

  return { params, setParams };
}
```

Usage:

```typescript
function ProductsPage() {
  const { params, setParams } = useTableSearchParams();
  const { data, isLoading } = useProducts(params);

  return (
    <ProductTable
      data={data?.items ?? []}
      onPaginationChange={(pagination) =>
        setParams({ page: pagination.pageIndex + 1, pageSize: pagination.pageSize })
      }
    />
  );
}
```

---

## Testing Patterns

### Test utility: create query wrapper

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createQueryWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}
```

### Test a query hook

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useProducts } from "./useProducts";
import { createQueryWrapper } from "../../test-utils/query-wrapper";
import { fetchProducts } from "../../api/product.api";

jest.mock("../../api/product.api");

describe("useProducts", () => {
  it("returns product list data", async () => {
    const mockData = {
      items: [{ id: "1", name: "Test Product" }],
      totalCount: 1,
      pageCount: 1,
      currentPage: 1,
    };
    (fetchProducts as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useProducts({ page: 1 }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});
```

### Test a form hook

```typescript
import { renderHook, act } from "@testing-library/react";
import { useProductForm } from "./useProductForm";
import { createQueryWrapper } from "../../test-utils/query-wrapper";

describe("useProductForm", () => {
  it("validates required fields on submit", async () => {
    const { result } = renderHook(
      () => useProductForm({ mode: "create" }),
      { wrapper: createQueryWrapper() }
    );

    await act(async () => {
      result.current.onSubmit();
    });

    expect(result.current.formErrors.name).toBe("Product name is required");
    expect(result.current.formErrors.category).toBe("Category is required");
  });
});
```

---

## Performance Guidelines

### Query configuration by use case

| Use Case | `staleTime` | `gcTime` | `refetchOnWindowFocus` | `placeholderData` |
|----------|------------|----------|----------------------|------------------|
| List page | 30s | 5min | false | `keepPreviousData` |
| Detail page | 60s | 10min | false | — |
| Dropdown options | 5min | 30min | false | — |
| Real-time data | 0 | 5min | true | — |
| Static config | Infinity | Infinity | false | — |

### Avoiding common performance issues

1. **Don't create a new `QueryClient` on every render** — create it outside the component or in a `useRef`
2. **Don't use `select` for expensive transforms** — use `useMemo` on the query result instead
3. **Don't invalidate `queryKey: []`** — this invalidates every query in the cache; be specific
4. **Don't forget `placeholderData: keepPreviousData`** — in TanStack Query v5 this is the correct option name; without it, switching pages causes a loading flash
5. **Don't subscribe to unused fields** — use `select` or `notifyOnChangeProps` to limit re-renders

---

## Form Component Patterns

### Form field wrapper

```typescript
import { Field, type FieldProps } from "@fluentui/react-components";

interface FormFieldProps extends Omit<FieldProps, "validationState" | "validationMessage"> {
  error?: string;
  children: React.ReactNode;
}

export function FormField({ error, children, ...props }: FormFieldProps) {
  return (
    <Field
      validationState={error ? "error" : "none"}
      validationMessage={error}
      {...props}
    >
      {children}
    </Field>
  );
}
```

### Shared form component (presentational)

The form component is a pure presentational component. It receives the hook return as props — it does not know or care whether it is creating or editing:

```typescript
import { makeStyles, Input, Dropdown, Option, Textarea, Button, Spinner, tokens } from "@fluentui/react-components";
import { FormField } from "../shared/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { ProductFormInput } from "../../schemas/product.schemas";

const useFormStyles = makeStyles({
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXL,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    marginTop: tokens.spacingVerticalXL,
  },
});

interface ProductFormProps {
  form: UseFormReturn<ProductFormInput>;
  values: ProductFormInput;
  formErrors: Record<string, string | undefined>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  onSubmit: () => void;
  onReset: () => void;
  submitLabel: string;
  onCancel?: () => void;
}

export function ProductForm({
  form: { register, setValue },
  values,
  formErrors,
  isSubmitting,
  isDirty,
  onSubmit,
  onReset,
  submitLabel,
  onCancel,
}: ProductFormProps) {
  const styles = useFormStyles();

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className={styles.grid}>
        <FormField label="Product Name" required error={formErrors.name}>
          <Input
            {...register("name")}
            placeholder="Enter product name"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="Category" required error={formErrors.category}>
          <Dropdown
            value={values.category}
            onOptionSelect={(_, data) => {
              setValue("category", data.optionValue ?? "", { shouldValidate: true });
            }}
            placeholder="Select a category"
            disabled={isSubmitting}
          >
            <Option value="food">Food</Option>
            <Option value="beverage">Beverage</Option>
            <Option value="supplement">Supplement</Option>
          </Dropdown>
        </FormField>

        <FormField label="Price" required error={formErrors.price}>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register("price", { valueAsNumber: true })}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="Status" required error={formErrors.status}>
          <Dropdown
            value={values.status}
            onOptionSelect={(_, data) => {
              setValue("status", data.optionValue as ProductFormInput["status"], { shouldValidate: true });
            }}
            disabled={isSubmitting}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="draft">Draft</Option>
          </Dropdown>
        </FormField>

        <FormField label="Description" error={formErrors.description}>
          <Textarea
            {...register("description")}
            placeholder="Enter product description"
            rows={4}
            disabled={isSubmitting}
          />
        </FormField>
      </div>

      <div className={styles.actions}>
        <Button appearance="secondary" onClick={onCancel ?? onReset} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          type="submit"
          disabled={isSubmitting || !isDirty}
          icon={isSubmitting ? <Spinner size="tiny" /> : undefined}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
```

### Page-level wiring — Create page

```typescript
import { useCreateProductForm } from "../../hooks/products/useCreateProductForm";
import { ProductForm } from "../products/ProductForm";

export function CreateProductPage({ onCancel }: { onCancel: () => void }) {
  const formState = useCreateProductForm({
    onSuccess: onCancel,
  });

  return (
    <ProductForm
      {...formState}
      submitLabel="Create Product"
      onCancel={onCancel}
    />
  );
}
```

### Page-level wiring — Edit page

```typescript
import { Spinner } from "@fluentui/react-components";
import { useProduct } from "../../hooks/products/useProduct";
import { useEditProductForm } from "../../hooks/products/useEditProductForm";
import { ProductForm } from "../products/ProductForm";

export function EditProductPage({ productId, onCancel }: { productId: string; onCancel: () => void }) {
  const { data: product, isLoading } = useProduct(productId);

  if (isLoading || !product) {
    return <Spinner size="large" label="Loading product..." />;
  }

  return (
    <EditProductFormWrapper
      productId={productId}
      defaultValues={{
        name: product.name,
        category: product.category,
        price: product.price,
        status: product.status,
        description: product.description ?? "",
      }}
      onCancel={onCancel}
    />
  );
}

function EditProductFormWrapper({
  productId,
  defaultValues,
  onCancel,
}: {
  productId: string;
  defaultValues: ProductFormInput;
  onCancel: () => void;
}) {
  const formState = useEditProductForm({
    productId,
    defaultValues,
    onSuccess: onCancel,
  });

  return (
    <ProductForm
      {...formState}
      submitLabel="Save Changes"
      onCancel={onCancel}
    />
  );
}
```

---

## Loading and Error State Patterns

### Query loading in page containers

```typescript
import { makeStyles, Spinner, Text, tokens } from "@fluentui/react-components";

const usePageStyles = makeStyles({
  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: "200px",
  },
  refetchIndicator: {
    position: "absolute",
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    zIndex: 1,
  },
});

function ProductsPage() {
  const styles = usePageStyles();
  const { data, isLoading, isFetching, isError, error, refetch } = useProducts({
    page: 1,
    pageSize: 25,
  });

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" label="Loading products..." />
      </div>
    );
  }

  if (isError) {
    return (
      <TableError
        error={error instanceof Error ? error : null}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      {isFetching && (
        <div className={styles.refetchIndicator} role="status" aria-label="Refreshing data">
          <Spinner size="tiny" />
        </div>
      )}
      <ProductTable data={data?.items ?? []} pageCount={data?.pageCount ?? 0} />
    </>
  );
}
```

### Toast notifications for mutations

```typescript
import { useToastController, Toast, ToastTitle, ToastBody } from "@fluentui/react-components";

function useProductActions() {
  const { dispatchToast } = useToastController();

  const deleteMutation = useDeleteProduct({
    onSuccess: () => {
      dispatchToast(
        <Toast>
          <ToastTitle>Product deleted</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    },
    onError: (error) => {
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to delete product</ToastTitle>
          <ToastBody>{error.message}</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    },
  });

  return { deleteMutation };
}
```

---

## Infinite Query Hooks — Self-Contained Pattern

### Cursor-based infinite query hook

```typescript
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getProducts } from "../../api/product.api";
import { productKeys } from "./useProducts";
import type { Product } from "../../schemas/product.schemas";

interface UseProductInfiniteListOptions {
  category?: string;
  status?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  enabled?: boolean;
}

export function useProductInfiniteList(options: UseProductInfiniteListOptions = {}) {
  const { enabled = true, ...filters } = options;

  const query = useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getProducts({ cursor: pageParam, limit: 50, ...filters }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 30_000,
  });

  const flatData = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const fetchedCount = flatData.length;

  return {
    ...query,
    flatData,
    totalCount,
    fetchedCount,
  };
}
```

### Offset-based infinite query hook

```typescript
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getOrders } from "../../api/order.api";
import { orderKeys } from "./useOrders";
import type { Order } from "../../schemas/order.schemas";

const PAGE_SIZE = 50;

interface UseOrderInfiniteListOptions {
  status?: string;
  enabled?: boolean;
}

export function useOrderInfiniteList(options: UseOrderInfiniteListOptions = {}) {
  const { enabled = true, ...filters } = options;

  const query = useInfiniteQuery({
    queryKey: orderKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getOrders({ offset: pageParam, limit: PAGE_SIZE, ...filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return fetched < lastPage.totalCount ? fetched : undefined;
    },
    enabled,
    staleTime: 30_000,
  });

  const flatData = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const fetchedCount = flatData.length;

  return {
    ...query,
    flatData,
    totalCount,
    fetchedCount,
  };
}
```

### API function for paginated endpoint

```typescript
import { z } from "zod";
import { productSchema } from "../../schemas/product.schemas";
import { ApiError } from "./base.api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

const paginatedResponseSchema = z.object({
  items: z.array(productSchema),
  nextCursor: z.string().nullable(),
  totalCount: z.number(),
});

export async function getProducts(params: {
  cursor?: string | null;
  limit: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  category?: string;
  status?: string;
}): Promise<z.infer<typeof paginatedResponseSchema>> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.sortField) searchParams.set("sortField", params.sortField);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.category) searchParams.set("category", params.category);
  if (params.status) searchParams.set("status", params.status);

  const response = await fetch(`${API_BASE}/products?${searchParams}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      errorBody?.message ?? `Request failed with status ${response.status}`,
      errorBody?.errors,
    );
  }
  return paginatedResponseSchema.parse(await response.json());
}
```

---
