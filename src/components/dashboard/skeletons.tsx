
export function ChartSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl h-96 flex flex-col animate-pulse">
      <div className="h-7 w-48 bg-white/5 rounded-lg mb-6"></div>
      <div className="flex-1 bg-white/5 rounded-xl"></div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-7 w-32 bg-white/5 rounded-lg"></div>
        <div className="h-8 w-8 bg-white/5 rounded-lg"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-white/5 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

export function SummarySkeleton() {
    return (
        <div className="col-span-1 lg:col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 glass rounded-2xl animate-pulse"></div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="glass p-6 rounded-2xl animate-pulse h-full">
            <div className="h-7 w-32 bg-white/5 rounded-lg mb-4"></div>
            <div className="space-y-2">
                 <div className="h-4 w-full bg-white/5 rounded"></div>
                 <div className="h-4 w-2/3 bg-white/5 rounded"></div>
            </div>
        </div>
    )
}
