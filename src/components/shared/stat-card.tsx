import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  borderColor?: string
  iconBg?: string
  className?: string
  delta?: string
  deltaType?: "increase" | "decrease" | "neutral"
}

export function StatCard({
  title,
  value,
  icon,
  borderColor = "border-l-primary",
  iconBg = "bg-primary/10",
  className,
  delta,
  deltaType = "neutral",
}: StatCardProps) {
  const deltaColor =
    deltaType === "increase"
      ? "text-red-600"
      : deltaType === "decrease"
        ? "text-emerald-600"
        : "text-gray-500"

  return (
    <div
      className={cn(
        "rounded-xl border border-l-4 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        borderColor,
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconBg)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="truncate text-xl font-bold tracking-tight">{value}</p>
          {delta && (
            <p className={cn("mt-0.5 text-xs font-medium", deltaColor)}>
              {delta} vs προηγ. έτος
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
