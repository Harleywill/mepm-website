export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div
        className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-navy-700 motion-safe:animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
