"use client";

export default function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-ocean-dark border-4 border-wood p-4 sm:p-6 rounded-lg shadow-2xl relative ${className}`}
    >
      {/* Corner Screws */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-wood-light"></div>
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-wood-light"></div>
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-wood-light"></div>
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-wood-light"></div>
      {children}
    </div>
  );
}
