export default function Loading() {
  return (
    <div className="flex flex-col flex-1 pb-20 animate-pulse">
      <div className="text-center pt-8 pb-4 px-4">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto" />
      </div>
      <div className="px-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="h-4 w-16 bg-gray-100 rounded mb-2" />
            <div className="h-3 w-full bg-gray-100 rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
