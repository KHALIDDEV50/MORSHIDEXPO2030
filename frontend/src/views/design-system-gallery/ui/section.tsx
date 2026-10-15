import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

export function GallerySection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="mb-5 flex flex-col gap-1">
        <h2 id={`${id}-title`} className="type-h2">
          {title}
        </h2>
        {description && <p className="type-body text-fg-secondary max-w-3xl">{description}</p>}
      </div>
      <div className={cn('flex flex-col gap-6', className)}>{children}</div>
    </section>
  );
}

export function DemoBlock({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className="border-border bg-surface rounded-lg border">
      <p className="type-caption text-fg-muted border-border border-b px-4 py-2.5">{label}</p>
      {/* Children may shrink below their content width so nothing pushes the page sideways on phones */}
      <div className={cn('flex flex-wrap items-center gap-3 p-4 sm:p-5 [&>*]:max-w-full [&>*]:min-w-0', className)}>
        {children}
      </div>
    </div>
  );
}
