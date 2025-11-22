export default function BaseBody({
  title,
  subtitle,
  children,
  actions,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 ${className || ''}`}>
      <div className="flex flex-col gap-4 justify-between w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight break-words">{title}</h1>
            <p className="text-muted-foreground text-sm break-words">{subtitle}</p>
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
        <div className="w-full max-w-full overflow-x-hidden">{children}</div>
      </div>
    </main>
  );
}
