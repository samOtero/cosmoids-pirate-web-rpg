"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "wood";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseStyle =
    "px-6 py-2 rounded font-bold uppercase tracking-wider transition-all transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800",
    secondary:
      "bg-gray-600 hover:bg-gray-500 text-white border-b-4 border-gray-800",
    danger: "bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800",
    wood: "bg-wood hover:bg-wood-light text-sand border-2 border-orange-900 border-b-4",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
