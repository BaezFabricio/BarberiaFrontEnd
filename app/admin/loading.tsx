export default function AdminLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-10%] h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl animate-pulse" />

      <div className="relative flex min-h-screen items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 shadow-[0_30px_90px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="grid min-h-[80vh] md:grid-cols-[18rem_1fr]">
            <aside className="hidden border-r border-border/70 bg-card/60 p-5 md:block">
              <div className="mb-6 flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/20">
                  <div className="absolute inset-0 animate-[pulse_1.8s_ease-in-out_infinite] bg-gradient-to-br from-amber-300/50 via-amber-100/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-muted/80" />
                  <div className="h-2 w-36 animate-pulse rounded-full bg-muted/60" />
                </div>
              </div>

              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-11 animate-pulse rounded-2xl border border-border/50 bg-gradient-to-r from-muted/45 via-muted/70 to-muted/45 bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]"
                  />
                ))}
              </div>
            </aside>

            <main className="flex-1">
              <div className="sticky top-0 z-10 border-b border-border/70 bg-background/75 px-4 py-4 backdrop-blur md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-5 w-44 animate-pulse rounded-full bg-muted/80" />
                    <div className="h-3 w-72 animate-pulse rounded-full bg-muted/60" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 w-9 animate-pulse rounded-xl bg-muted/70" />
                    <div className="h-9 w-24 animate-pulse rounded-xl bg-amber-400/20" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-4 md:p-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-28 animate-pulse rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-muted/40"
                    />
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="xl:col-span-2 rounded-3xl border border-border/60 bg-card p-5">
                    <div className="mb-5 h-4 w-44 animate-pulse rounded-full bg-muted/80" />
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="h-14 animate-pulse rounded-2xl bg-gradient-to-r from-muted/45 via-muted/70 to-muted/45 bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]" />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-3xl border border-border/60 bg-card p-5">
                      <div className="mb-5 h-4 w-32 animate-pulse rounded-full bg-muted/80" />
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="h-16 animate-pulse rounded-2xl bg-gradient-to-r from-muted/45 via-muted/70 to-muted/45 bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]" />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-border/60 bg-card p-5">
                      <div className="mb-5 h-4 w-36 animate-pulse rounded-full bg-muted/80" />
                      <div className="h-28 rounded-3xl bg-gradient-to-r from-muted/45 via-muted/70 to-muted/45 bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-3 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 shadow-sm">
                    <div className="size-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Preparando módulo...</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

    </div>
  )
}
