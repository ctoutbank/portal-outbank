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
    <main className={`flex-1 overflow-auto p-6 ${className}`}>
      <div className="flex flex-col gap-4 justify-between">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {actions && <>{actions}</>}
        </div>
        <div className="">{children}</div>
      </div>
    </main>
  );
}
