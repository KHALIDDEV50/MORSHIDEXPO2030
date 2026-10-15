'use client';

import { ChevronRight } from 'lucide-react';
import { DropdownMenu as MenuPrimitive } from 'radix-ui';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib';

type DropdownSubmenuProps = {
  /** Controlled by the parent menu so only one submenu can be open at a time */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: ReactNode;
  label: string;
  /** Current value shown on the row (e.g. "العربية", "Dark") */
  value?: ReactNode;
  /**
   * Submenu items. Call `select(event)` from an item's `onSelect` to apply the choice, close this
   * submenu and keep the parent menu open.
   */
  children: (api: { select: (event: Event) => void }) => ReactNode;
};

/**
 * Click/keyboard-driven submenu (no hover dependency) with explicit rules:
 * - Click or Enter/Space/Arrow opens it; clicking its open row again closes it.
 * - Hovering other rows never closes it; moving into it never closes it.
 * - Escape closes only the submenu first (focus returns to its row); the next Escape closes the menu.
 * - Clicking elsewhere inside the parent menu keeps the menu open; clicking outside closes everything.
 * Positioning (beside the row, mirrored in RTL, flipping near viewport edges) comes from Radix.
 */
export function DropdownSubmenu({ open, onOpenChange, icon, label, value, children }: DropdownSubmenuProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  const closeAndRefocus = () => {
    onOpenChange(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <MenuPrimitive.Sub open={open} onOpenChange={onOpenChange}>
      <MenuPrimitive.SubTrigger
        ref={triggerRef}
        // No hover-to-open: block Radix's pointer-intent handling on this row
        onPointerMove={(e) => e.preventDefault()}
        onPointerLeave={(e) => e.preventDefault()}
        onClick={(e) => {
          if (open) {
            // Toggle: clicking the open row closes its submenu
            e.preventDefault();
            onOpenChange(false);
          }
        }}
        className={cn(
          'text-fg hover:bg-surface-muted data-[highlighted]:bg-surface-muted data-[state=open]:bg-surface-muted flex cursor-pointer items-center gap-2.5 rounded-sm px-3 py-2 text-[0.9375rem] outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] [&_svg]:size-4',
        )}
      >
        <span className="text-fg-secondary" aria-hidden>
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        {value && <span className="type-caption text-fg-muted">{value}</span>}
        <ChevronRight className="flip-rtl text-fg-muted" aria-hidden />
      </MenuPrimitive.SubTrigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.SubContent
          sideOffset={6}
          alignOffset={-4}
          collisionPadding={8}
          className="z-dropdown border-border bg-surface-elevated animate-pop-in min-w-44 rounded-md border p-1 shadow-lg"
          onEscapeKeyDown={(e) => {
            // Escape closes this submenu first, not the whole menu
            e.preventDefault();
            closeAndRefocus();
          }}
          onFocusOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Clicks inside the parent menu (e.g. the other submenu's row) must not close the menu tree
            const target = e.target as Element | null;
            if (target?.closest('[role="menu"]')) e.preventDefault();
          }}
        >
          {children({
            select: (event) => {
              event.preventDefault(); // keep the parent menu open
              closeAndRefocus();
            },
          })}
        </MenuPrimitive.SubContent>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Sub>
  );
}
