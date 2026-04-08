export default function AttendanceLoading() {
    return (
        <div className="px-4 py-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="mb-8">
                <div className="h-8 w-64 bg-skeleton-bg rounded-lg animate-pulse" />
                <div className="h-4 w-48 bg-skeleton-bg rounded-lg animate-pulse mt-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-2xl h-80 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
