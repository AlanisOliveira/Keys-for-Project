import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "default" && "border-slate-200 bg-white text-slate-700",
        tone === "warning" && "border-amber-200 bg-amber-100 text-amber-900",
        tone === "danger" && "border-red-200 bg-red-100 text-red-900",
      )}
    >
      {children}
    </span>
  );
}
