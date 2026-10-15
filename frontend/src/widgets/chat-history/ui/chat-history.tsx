'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, MessagesSquare, MoreHorizontal, Pencil, SquarePen, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { CharacterAvatar, type CharacterId } from '@/entities/ai-character';
import { conversationKeys, conversationRepository, historyGroup, useConversations, type Conversation, type HistoryGroup } from '@/entities/conversation';
import { cn } from '@/shared/lib';
import {
  Button,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Input,
  Label,
  SearchField,
  SegmentedControl,
  Skeleton,
  toast,
} from '@/shared/ui';

const GROUPS: HistoryGroup[] = ['today', 'week', 'older'];

type Props = {
  /** Active character: the default filter ("this character") and the New conversation target */
  character: CharacterId;
  activeId: string | null;
  onOpen: (conversation: Conversation) => void;
  onNew: () => void;
  /** The open conversation was deleted */
  onDeletedActive?: () => void;
  className?: string;
};

/**
 * Conversation history (PRD §4.1): grouped Today / Last 7 days / Older, searchable, filtered to
 * the active character (or all), with rename and delete (confirmed) in a ⋯ menu. Persisted.
 */
export function ChatHistory({ character, activeId, onOpen, onNew, onDeletedActive, className }: Props) {
  const t = useTranslations('chatHistory');
  const tc = useTranslations('characters');
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<'character' | 'all'>('character');
  const list = useConversations({ characterId: scope === 'all' ? undefined : character, q });
  const [renaming, setRenaming] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState<Conversation | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: conversationKeys.all });
  const remove = useMutation({
    mutationFn: (c: Conversation) => conversationRepository.remove(c.id),
    onSuccess: (_d, c) => {
      void refresh();
      toast.success(t('deletedToast'));
      if (c.id === activeId) onDeletedActive?.();
      setDeleting(null);
    },
    onError: () => toast.error(t('errorToast')),
  });

  const items = list.data ?? [];
  const grouped = GROUPS.map((g) => ({ group: g, items: items.filter((c) => historyGroup(c.updatedAt) === g) })).filter((g) => g.items.length > 0);

  return (
    <nav aria-label={t('label')} className={cn('flex min-h-0 flex-col gap-3', className)}>
      <div className="flex flex-col gap-3 p-3 pb-0">
        <Button variant="gradient" fullWidth onClick={onNew}>
          <SquarePen aria-hidden />
          {t('new', { name: tc(`${character}.name`) })}
        </Button>
        <SearchField label={t('search')} placeholder={t('search')} value={q} onValueChange={setQ} />
        <SegmentedControl
          label={t('filterLabel')}
          value={scope}
          onValueChange={setScope}
          options={[
            { value: 'character', label: tc(`${character}.name`) },
            { value: 'all', label: t('all') },
          ]}
          className="w-full [&>*]:flex-1"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {list.isPending ? (
          <div className="flex flex-col gap-2 p-1" aria-hidden>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : grouped.length === 0 ? (
          <EmptyState icon={<MessagesSquare />} title={q ? t('noResults') : t('empty')} description={q ? undefined : t('emptyHint')} />
        ) : (
          grouped.map(({ group, items: rows }) => (
            <section key={group} aria-labelledby={`hist-${group}`} className="flex flex-col gap-0.5 pt-2">
              <h3 id={`hist-${group}`} className="type-caption text-fg-muted px-2 pb-1 font-bold">
                {t(`groups.${group}`)}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {rows.map((c) => (
                  <li key={c.id} className={cn('group/row flex items-center gap-1 rounded-md', c.id === activeId ? 'bg-selection' : 'hover:bg-surface-muted')}>
                    <button
                      type="button"
                      onClick={() => onOpen(c)}
                      aria-current={c.id === activeId ? 'page' : undefined}
                      className="focus-ring flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-start"
                    >
                      <CharacterAvatar id={c.characterId} size="xs" ring={false} decorative />
                      <span className="min-w-0 flex-1 truncate text-sm" dir="auto">
                        {c.title}
                      </span>
                      {c.context?.kind === 'place' && <MapPin className="text-fg-muted size-3.5 shrink-0" aria-label={t('placeContext')} />}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={t('actionsFor', { title: c.title })}
                          className="focus-ring text-fg-muted hover:text-fg grid size-8 shrink-0 cursor-pointer place-items-center rounded-md opacity-100 md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100 md:data-[state=open]:opacity-100"
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setRenaming(c)}>
                          <Pencil aria-hidden />
                          {t('rename')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setDeleting(c)} className="text-error-fg">
                          <Trash2 aria-hidden />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {renaming && <RenameDialog conversation={renaming} onClose={() => setRenaming(null)} onSaved={() => void refresh()} />}

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        {deleting && (
          <DialogContent
            title={t('deleteTitle')}
            description={t('deleteDescription', { title: deleting.title })}
            closeOnOutsideClick={false}
            footer={
              <div className="flex w-full justify-end gap-2">
                <Button variant="ghost" onClick={() => setDeleting(null)}>
                  {t('cancel')}
                </Button>
                <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(deleting)}>
                  <Trash2 aria-hidden />
                  {t('delete')}
                </Button>
              </div>
            }
          >
            {null}
          </DialogContent>
        )}
      </Dialog>
    </nav>
  );
}

function RenameDialog({ conversation, onClose, onSaved }: { conversation: Conversation; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations('chatHistory');
  const id = useId();
  const [title, setTitle] = useState(conversation.title);
  const rename = useMutation({
    mutationFn: () => conversationRepository.rename(conversation.id, title),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: () => toast.error(t('errorToast')),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title={t('renameTitle')}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" form={`${id}-form`} loading={rename.isPending} disabled={!title.trim()}>
              {t('save')}
            </Button>
          </div>
        }
      >
        <form
          id={`${id}-form`}
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) rename.mutate();
          }}
          className="flex flex-col gap-1.5"
        >
          <Label htmlFor={id}>{t('titleLabel')}</Label>
          <Input id={id} value={title} maxLength={120} dir="auto" onChange={(e) => setTitle(e.target.value)} autoFocus />
        </form>
      </DialogContent>
    </Dialog>
  );
}
