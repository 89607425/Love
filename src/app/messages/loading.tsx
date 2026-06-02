export default function Loading() {
  return (
    <div className="flex flex-col h-[100dvh] pb-20 animate-pulse">
      <div className="text-center pt-8 pb-4 px-4 shrink-0">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto" />
      </div>
      <div className="flex-1 px-4 py-2 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div className={`rounded-2xl p-3 ${i % 2 === 0 ? "bg-gray-100" : "bg-gray-200"} w-2/3`}>
              <div className="h-3 bg-white/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
