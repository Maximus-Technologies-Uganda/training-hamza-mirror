export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="h-8 skeleton w-48"></div>
      
      {/* Content skeletons */}
      <div className="space-y-4">
        <div className="card">
          <div className="h-6 skeleton w-3/4 mb-4"></div>
          <div className="h-4 skeleton w-full mb-2"></div>
          <div className="h-4 skeleton w-5/6 mb-2"></div>
          <div className="h-4 skeleton w-4/6"></div>
        </div>
        
        <div className="card">
          <div className="h-6 skeleton w-2/3 mb-4"></div>
          <div className="h-4 skeleton w-full mb-2"></div>
          <div className="h-4 skeleton w-5/6 mb-2"></div>
          <div className="h-4 skeleton w-3/5"></div>
        </div>
        
        <div className="card">
          <div className="h-6 skeleton w-3/5 mb-4"></div>
          <div className="h-4 skeleton w-full mb-2"></div>
          <div className="h-4 skeleton w-4/5"></div>
        </div>
      </div>
    </div>
  );
}
