---
name: tanstack-query-forms
description: Generates type-safe data fetching hooks with TanStack Query v5, Zod schema validation, and React Hook Form integration. Triggers on data fetching, mutations, form validation.
---

# TanStack Query — Implementation Guide

## When to use

When the user says "fetch data", "create a query hook", "build a form", "add validation", "submit this form", "create a mutation", "handle form errors", "infinite scroll", "add loading state", or anything involving server data fetching, form handling, or API integration.

## Stack

- TanStack Query v5 — `@tanstack/react-query`
- Zod — `zod`
- React Hook Form — `react-hook-form`
- RHF Zod resolver — `@hookform/resolvers/zod`
- UI — Fluent UI React v9 (`@fluentui/react-components`)
- Icons — `@fluentui/react-icons`
- Styling — Fluent UI `makeStyles` + `tokens` (no CSS files, no inline styles)
- Language — TypeScript (strict)

## File structure

```
schemas/{domain}.schemas.ts         # Zod schemas + derived types
api/{domain}.api.ts                 # Typed fetch wrappers + ApiError
hooks/{domain}/
  use{Entity}s.ts                   # List query + key factory
  use{Entity}.ts                    # Detail query
  use{Entity}InfiniteList.ts        # Infinite scroll query
  useDelete{Entity}.ts              # Standalone delete mutation
  useCreate{Entity}Form.ts          # Create form hook (RHF + Zod + mutation)
  useEdit{Entity}Form.ts            # Edit form hook (RHF + Zod + mutation)
```

---

## 1. Zod Schemas

`schemas/{domain}.schemas.ts`

```typescript
import { z } from "zod";

// Response schema
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Required"),
  price: z.number().nonnegative("Must be 0 or more"),
  status: z.enum(["active", "inactive", "draft"]),
  createdAt: z.string().datetime().transform((v) => new Date(v)),
});

export type Product = z.infer<typeof productSchema>;

export const productListSchema = z.object({
  items: z.array(productSchema),
  totalCount: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative(),
});

export type ProductList = z.infer<typeof productListSchema>;

// Form schema
export const productFormSchema = z.object({
  name: z.string().min(1, "Required").max(200),
  price: z.number({ invalid_type_error: "Must be a number" }).nonnegative("Must be 0 or more"),
  status: z.enum(["active", "inactive", "draft"], {
    errorMap: () => ({ message: "Select a valid status" }),
  }),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
```

Rules:
- Always derive types with `z.infer<>` — never duplicate manually
- Use `z.enum()` for known value sets, never `z.string()`
- Use `.transform()` for date strings
- Every rule needs a human-readable error message

---

## 2. API Client

`api/{domain}.api.ts`

```typescript
import { productSchema, productListSchema, type ProductFormInput, type Product, type ProductList } from "../schemas/product.schemas";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function handleResponse<T>(res: Response, schema: { parse: (d: unknown) => T }): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.message ?? `Request failed: ${res.status}`, body?.errors);
  }
  return schema.parse(await res.json());
}

export async function fetchProducts(params: { page?: number; search?: string } = {}): Promise<ProductList> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.search) qs.set("search", params.search);
  return handleResponse(await fetch(`${API_BASE}/products?${qs}`), productListSchema);
}

export async function fetchProduct(id: string): Promise<Product> {
  return handleResponse(await fetch(`${API_BASE}/products/${id}`), productSchema);
}

export async function createProduct(data: ProductFormInput): Promise<Product> {
  return handleResponse(
    await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    productSchema
  );
}

export async function updateProduct(id: string, data: Partial<ProductFormInput>): Promise<Product> {
  return handleResponse(
    await fetch(`${API_BASE}/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    productSchema
  );
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new ApiError(res.status, "Failed to delete");
}
```

Rules:
- Always validate responses through Zod `.parse()` — never trust raw JSON
- Throw `ApiError` with status — never swallow errors
- Use `URLSearchParams` for query strings — never string concatenation
- Base URL from env variable — never hardcoded
- Don't retry 4xx — they're deterministic failures

---

## 3. Query Key Factory

Define once per domain, co-located with the list hook:

```typescript
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};
```

Cache invalidation:
- `productKeys.all` — invalidates everything
- `productKeys.lists()` — invalidates all lists
- `productKeys.detail(id)` — invalidates one item

---

## 4. Query Hooks

### List query — `hooks/{domain}/use{Entity}s.ts`

```typescript
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchProducts } from "../../api/product.api";

export function useProducts(params: { page?: number; search?: string; enabled?: boolean } = {}) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: productKeys.list(queryParams),
    queryFn: () => fetchProducts(queryParams),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
```

### Detail query — `hooks/{domain}/use{Entity}.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchProduct } from "../../api/product.api";

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}
```

Rules:
- Components never call `useQuery` directly — always through custom hooks
- Return the full query result — never destructure inside the hook
- `keepPreviousData` on lists prevents layout flash during pagination
- `enabled: !!id` guards detail queries from running with undefined id

---

## 5. Infinite Query Hook

`hooks/{domain}/use{Entity}InfiniteList.ts`

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProducts } from "../../api/product.api";
import { productKeys } from "./useProducts";

export function useProductInfiniteList(params: { search?: string; enabled?: boolean } = {}) {
  const { enabled = true, ...queryParams } = params;

  const query = useInfiniteQuery({
    queryKey: productKeys.list({ ...queryParams, infinite: true }),
    queryFn: ({ pageParam = 1 }) => fetchProducts({ ...queryParams, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.pageCount ? allPages.length + 1 : null,
    enabled,
    staleTime: 30_000,
  });

  const flatData = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  return { flatData, totalCount, fetchedCount: flatData.length, ...query };
}
```

Rules:
- Each entity gets its own self-contained hook — no generic wrapper
- Always memoize `flatData` with `useMemo` — `flatMap` creates a new reference every render
- `getNextPageParam` returns `null` when no more pages
- Mutations must also invalidate infinite query keys

---

## 6. Delete Mutation Hook

`hooks/{domain}/useDelete{Entity}.ts`

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../../api/product.api";
import { productKeys } from "./useProducts";

export function useDeleteProduct(options: { onSuccess?: () => void; onError?: (e: Error) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      options.onSuccess?.();
    },
    onError: options.onError,
  });
}
```

Rules:
- Only delete gets a standalone hook — create/update mutations live inside form hooks
- Always invalidate related queries on success
- Accept `onSuccess`/`onError` callbacks — let the consumer handle UI

---

## 7. Form Hooks

Create and edit are always separate hooks — no `mode` parameter, no conditional logic.

### Create form — `hooks/{domain}/useCreate{Entity}Form.ts`

```typescript
import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormInput } from "../../schemas/product.schemas";
import { createProduct, ApiError } from "../../api/product.api";
import { productKeys } from "./useProducts";

export function useCreateProductForm(options: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", price: 0, status: "draft" },
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      form.reset();
      options.onSuccess?.();
    },
  });

  const handleSubmit: SubmitHandler<ProductFormInput> = async (data) => {
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof ProductFormInput, { type: "server", message: messages[0] });
        });
      }
    }
  };

  const formErrors = Object.fromEntries(
    Object.entries(form.formState.errors).map(([k, v]) => [k, v?.message])
  ) as Record<string, string | undefined>;

  return {
    form,
    values: form.watch(),
    formErrors,
    isSubmitting: mutation.isPending,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    onSubmit: form.handleSubmit(handleSubmit),
    onReset: () => form.reset(),
  };
}
```

### Edit form — `hooks/{domain}/useEdit{Entity}Form.ts`

```typescript
import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormInput } from "../../schemas/product.schemas";
import { updateProduct, ApiError } from "../../api/product.api";
import { productKeys } from "./useProducts";

export function useEditProductForm({
  productId,
  defaultValues,
  onSuccess,
}: {
  productId: string;
  defaultValues: ProductFormInput;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<ProductFormInput>) => updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      onSuccess?.();
    },
  });

  const handleSubmit: SubmitHandler<ProductFormInput> = async (data) => {
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof ProductFormInput, { type: "server", message: messages[0] });
        });
      }
    }
  };

  const formErrors = Object.fromEntries(
    Object.entries(form.formState.errors).map(([k, v]) => [k, v?.message])
  ) as Record<string, string | undefined>;

  return {
    form,
    values: form.watch(),
    formErrors,
    isSubmitting: mutation.isPending,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    onSubmit: form.handleSubmit(handleSubmit),
    onReset: () => form.reset(),
  };
}
```

Form hook rules:
- Always separate create/edit hooks — never a shared hook with `mode`
- Each hook embeds its own `useMutation` — never import standalone create/update mutations
- `isSubmitting` comes from `mutation.isPending` — not RHF's built-in (resolves too early)
- `formErrors` is a flat `Record<string, string | undefined>` — consumers never read raw error objects
- Create hook owns its defaults; edit hook requires `defaultValues` from the caller
- Map 422 `fieldErrors` to form fields via `form.setError()`

---

## 8. Form Component (Fluent UI)

Full form component implementations are in the patterns reference — see "Form Component Patterns" section.

Architecture:

| Component | File | Purpose |
| --- | --- | --- |
| `FormField` | `components/shared/FormField.tsx` | Wraps Fluent `Field` with `error` prop |
| `{Entity}Form` | `components/{domain}/{Entity}Form.tsx` | Pure presentational form |
| `Create{Entity}Page` | Page that calls `useCreate{Entity}Form` and spreads into the form |
| `Edit{Entity}Page` | Page that loads server data, then calls `useEdit{Entity}Form` |

```tsx
// components/shared/FormField.tsx
import { Field, type FieldProps } from "@fluentui/react-components";

interface FormFieldProps extends Omit<FieldProps, "validationState" | "validationMessage"> {
  error?: string;
  children: React.ReactNode;
}

export function FormField({ error, children, ...props }: FormFieldProps) {
  return (
    <Field validationState={error ? "error" : "none"} validationMessage={error} {...props}>
      {children}
    </Field>
  );
}
```

```tsx
// components/{domain}/{Entity}Form.tsx
import { makeStyles, Input, Button, Spinner, tokens } from "@fluentui/react-components";
import { FormField } from "../shared/FormField";
import type { useCreateProductForm } from "../../hooks/product/useCreateProductForm";

const useStyles = makeStyles({
  form: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalL },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXL,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
  },
});

type FormProps = ReturnType<typeof useCreateProductForm> & {
  submitLabel?: string;
  onCancel?: () => void;
};

export function ProductForm({ form: { register }, formErrors, isSubmitting, isDirty, onSubmit, onReset, onCancel, submitLabel = "Save" }: FormProps) {
  const styles = useStyles();

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className={styles.form}>
        <FormField label="Name" required error={formErrors.name}>
          <Input {...register("name")} disabled={isSubmitting} />
        </FormField>

        <FormField label="Price" required error={formErrors.price}>
          <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} disabled={isSubmitting} />
        </FormField>
      </div>

      <div className={styles.actions}>
        <Button appearance="secondary" onClick={onCancel ?? onReset} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          type="submit"
          disabled={!isDirty || isSubmitting}
          icon={isSubmitting ? <Spinner size="tiny" /> : undefined}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
```

Styling rules:
- All styles via `makeStyles` + `tokens` — no CSS files, no inline `style={{}}`
- No hardcoded colors or spacing — always `tokens.*`
- Use `mergeClasses` for conditional class composition

---

## 9. QueryClient Provider

```tsx
// providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiError } from "../api/product.api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

---

## Advanced patterns

For complex scenarios, load the reference file on-demand:

`#[[file:references/tanstack-query-patterns.md]]`

Covers:
- Optimistic updates (delete, toggle)
- Dependent queries
- Prefetching on hover / navigation
- Infinite scroll with sort + filter reset + IntersectionObserver
- Polling / real-time data
- Multi-step forms
- Field arrays (`useFieldArray`)
- Zod schema composition (shared fields, discriminated unions, cross-field refinements)
- Query error boundaries
- URL state sync with table params
- Testing patterns (query hooks, form hooks, test wrappers)

---

## Common pitfalls

- Never call `useQuery`/`useMutation` directly in components — always wrap in a custom hook
- Never use inline query key strings — always use the key factory
- Never create standalone create/update mutation hooks — they belong inside form hooks
- Never use RHF's `isSubmitting` — use `mutation.isPending` instead
- Never skip Zod validation on API responses — shapes change without notice
- Never omit `shouldValidate: true` when using `setValue()` for controlled inputs
- Never forget `noValidate` on `<form>` — browser validation conflicts with Zod
- Never flatten infinite pages without `useMemo` — creates a new array reference every render
- Never set `staleTime: 0` — causes refetches on every mount
- Never forget to invalidate queries after mutations
