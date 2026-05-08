type Props = {
  rows?: number;
  cols?: number;
};

export function SkeletonTable({ rows = 5, cols = 4 }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5dfc9] bg-white shadow-sm">
      <div className="h-11 bg-[#faf7f0] px-5 py-3">
        <div className="h-3 w-48 animate-pulse rounded bg-[#e5dfc9]" />
      </div>
      <div className="divide-y divide-[#f5f0e5]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-3 animate-pulse rounded bg-[#eef4f6]"
                style={{ width: `${60 + ((i + j) % 3) * 30}px`, animationDelay: `${(i + j) * 50}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-[#e5dfc9] bg-white p-6"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-3 w-24 rounded bg-[#eef4f6]" />
          <div className="mt-4 h-8 w-32 rounded bg-[#e5dfc9]" />
          <div className="mt-2 h-2.5 w-20 rounded bg-[#eef4f6]" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, title = 'Error loading data' }: { message: string; title?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
        x
      </span>
      <div>
        <p className="text-sm font-semibold text-red-700">{title}</p>
        <p className="mt-0.5 text-xs text-red-500">{message}</p>
      </div>
    </div>
  );
}

