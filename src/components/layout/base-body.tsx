export default function BaseBody({
  title,
  subtitle,
  children,
  actions,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const hasTitle = title && title.trim() !== '';
  const hasSubtitle = subtitle && subtitle.trim() !== '';
  const showHeader = hasTitle || hasSubtitle || actions;

  return (
    <main className={`flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 bg-[#161616] ${className || ''}`}>
      <div className={`flex flex-col ${showHeader ? 'gap-4' : ''} justify-between w-full max-w-full overflow-x-hidden`}>
        {showHeader && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              {hasTitle && <h1 className="text-[22px] font-semibold tracking-tight break-words text-white">{title}</h1>}
              {hasSubtitle && <p className="text-[#5C5C5C] text-sm break-words">{subtitle}</p>}
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
        )}
        <div className="w-full max-w-full overflow-x-hidden">{children}</div>
      </div>
    </main>
  );
}
