export default function Loading() {
  return (
    <div className="px-4 pt-4" aria-busy aria-label="Loading">
      <div className="skeleton h-6 w-40" />
      <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton aspect-square" />)}
      </div>
    </div>
  );
}
