import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "verified" | "warning" | "demo";
  children: React.ReactNode;
}) {
  const variants = {
    default: "bg-sand text-charcoal",
    verified: "bg-deep-green/10 text-deep-green border border-deep-green/20",
    warning: "bg-bronze/10 text-bronze border border-bronze/20",
    demo: "bg-charcoal/5 text-charcoal/70 border border-charcoal/10",
  };
  return (
    <span
      className={cn(
        "mr-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium last:mr-0",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border border-charcoal/10 bg-ivory shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-6 pb-3", className)}>{children}</div>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}
