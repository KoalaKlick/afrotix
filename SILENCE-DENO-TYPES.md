# Silencing Deno Type Complaints (Supabase Edge Functions)

## 1. Add a `deno.json` config in your functions directory

```jsonc
// supabase/functions/deno.json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

## 2. Use `// @ts-ignore` or `// @ts-expect-error` inline

```ts
// @ts-ignore -- Deno types not available locally
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-expect-error -- Deno global not typed in this env
const val = Deno.env.get("MY_VAR");
```

## 3. Add a `/// <reference>` directive for Deno types

At the top of each edge function file:

```ts
/// <reference types="https://deno.land/x/deploy@0.12.0/types.ts" />
// OR for newer setups:
/// <reference lib="deno.ns" />
```

## 4. Install Deno types as a dev dependency (hybrid Node/Deno repos)

```bash
npm install -D @types/deno
# or
pnpm add -D @supabase/functions-js
```

Then in a `d.ts` file:

```ts
// supabase/functions/global.d.ts
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: any;
};
```

## 5. Exclude edge functions from `tsconfig.json`

In your root `tsconfig.json`:

```jsonc
{
  "exclude": ["supabase/functions/**"]
}
```

This prevents your main TypeScript compiler from checking Deno files.

## 6. VS Code settings (per-workspace)

In `.vscode/settings.json`:

```jsonc
{
  // Enable Deno extension only for edge functions
  "deno.enablePaths": ["supabase/functions"],
  // Disable TS checking in those paths from the default TS server
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.associations": {
    "supabase/functions/**/*.ts": "typescript"
  }
}
```

If you have the **Deno VS Code extension** installed, it handles types automatically for `deno.enablePaths`.

## 7. Import maps (no more URL import complaints)

```jsonc
// supabase/functions/import_map.json
{
  "imports": {
    "std/": "https://deno.land/std@0.168.0/",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

Reference it in `deno.json`:

```jsonc
{
  "importMap": "./import_map.json"
}
```

## Quick checklist

| Complaint | Fix |
|---|---|
| `Cannot find name 'Deno'` | Add `/// <reference lib="deno.ns" />` or declare global |
| `Cannot find module 'https://...'` | Add import map or `// @ts-ignore` |
| `No types for std library` | Use `deno.json` with `compilerOptions` |
| TS server fights Deno extension | Set `deno.enablePaths` in VS Code settings |
| `Property does not exist on type` | `// @ts-expect-error` or widen type with `as any` |
| Edge function works but IDE complains | Exclude from root `tsconfig.json` |
