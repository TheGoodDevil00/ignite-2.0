export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-3 w-36 animate-pulse rounded bg-card" />
        <div className="mt-3 h-9 w-56 animate-pulse rounded bg-card" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-lg border border-subtle bg-card" key={index} />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg border border-subtle bg-card" />
    </div>
  );
}
