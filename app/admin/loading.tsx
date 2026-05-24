import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-4 space-y-3"
          >
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            <div className="h-6 w-12 rounded bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-muted/40 px-4 py-3 flex gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded bg-muted animate-pulse"
              style={{ width: `${60 + i * 12}px` }}
            />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3.5 flex gap-8 border-t border-border/40"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="h-3.5 rounded bg-muted/50 animate-pulse"
                style={{
                  width: `${50 + ((i + j) % 3) * 20}px`,
                  animationDelay: `${(i * 5 + j) * 50}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Centered spinner for additional feedback */}
      <div className="flex justify-center pt-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
      </div>
    </div>
  );
}
