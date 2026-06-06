function UsersLoadingSkeleton({ count = 3, isSidebarCollapsed = false }) {
  const items = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <div className="space-y-1 px-1">
      {items.map((item) => (
        <div 
          key={item} 
          className={`p-3 rounded-lg animate-pulse flex items-center ${
            isSidebarCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="w-9 h-9 bg-white/[0.06] rounded-full flex-shrink-0"></div>
          {!isSidebarCollapsed && (
            <div className="flex-1">
              <div className="h-3 bg-white/[0.06] rounded w-3/4 mb-2"></div>
              <div className="h-2.5 bg-white/[0.04] rounded w-1/2"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default UsersLoadingSkeleton;