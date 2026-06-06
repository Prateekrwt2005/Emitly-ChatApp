function MessagesLoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className={`flex ${
            index % 2 === 0 ? "justify-start" : "justify-end"
          } animate-pulse`}
        >
          <div
            className={`h-8 rounded-2xl ${
              index % 2 === 0
                ? "bg-[#1e1e1e] w-40"
                : "bg-white/10 w-32"
            }`}
          ></div>
        </div>
      ))}
    </div>
  );
}

export default MessagesLoadingSkeleton;