import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return <div className={cn("rounded-3xl border border-white/60 bg-white/80 p-6 shadow-panel backdrop-blur", className)}>{children}</div>;
}
