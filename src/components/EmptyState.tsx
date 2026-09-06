export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded border border-dashed border-border px-6 py-8 text-center text-sm text-faint">
      {children}
    </p>
  );
}
