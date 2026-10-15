'use client';

import {
  ArrowUp,
  Bell,
  Ellipsis,
  List,
  Map,
  MessageCircle,
  Pencil,
  Plus,
  Sparkles,
  Trash,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Breadcrumbs,
  Button,
  Checkbox,
  DemoBadge,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Label,
  Pagination,
  PriorityBadge,
  SearchField,
  SegmentedControl,
  Select,
  Sheet,
  SheetContent,
  SheetTrigger,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  toast,
} from '@/shared/ui';
import { DemoBlock, GallerySection } from './section';

export function ComponentsShowcase() {
  const t = useTranslations('designSystem');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'chat' | 'map'>('chat');
  const [listView, setListView] = useState<'list' | 'map'>('list');
  const [page, setPage] = useState(3);
  const [notify, setNotify] = useState(true);
  const [done, setDone] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>(t('forms.nameError'));

  const simulate = (setter: (v: boolean) => void) => {
    setter(true);
    window.setTimeout(() => setter(false), 1200);
  };

  return (
    <>
      <GallerySection id="buttons" title={t('sections.buttons.title')} description={t('sections.buttons.description')}>
        <DemoBlock label={t('buttons.variants')}>
          <Button variant="gradient">
            <Sparkles aria-hidden />
            {t('buttons.newConversation')}
          </Button>
          <Button>{t('buttons.saveToPlans')}</Button>
          <Button variant="secondary">{t('buttons.editPlan')}</Button>
          <Button variant="ghost">{t('buttons.cancel')}</Button>
          <Button variant="danger">
            <Trash aria-hidden />
            {t('buttons.delete')}
          </Button>
          <Button variant="link">{t('buttons.viewDetails')}</Button>
        </DemoBlock>
        <DemoBlock label={t('buttons.sizesStates')}>
          <Button size="sm">{t('buttons.small')}</Button>
          <Button size="md">{t('buttons.medium')}</Button>
          <Button size="lg">{t('buttons.large')}</Button>
          <Button loading={loading} onClick={() => simulate(setLoading)}>
            {t('buttons.clickToLoad')}
          </Button>
          <Button disabled>{t('buttons.disabled')}</Button>
          <IconButton label={t('buttons.send')} variant="gradient" icon={<ArrowUp aria-hidden />} />
          <IconButton label={t('buttons.notifications')} variant="secondary" icon={<Bell aria-hidden />} />
          <IconButton label={t('buttons.more')} icon={<Ellipsis aria-hidden />} />
        </DemoBlock>
      </GallerySection>

      <GallerySection id="forms" title={t('sections.forms.title')} description={t('sections.forms.description')}>
        <div className="grid gap-4 lg:grid-cols-2">
          <DemoBlock label={t('forms.search')} className="flex-col items-stretch">
            <SearchField size="lg" label={t('forms.searchLabel')} placeholder={t('forms.searchPlaceholder')} value={search} onValueChange={setSearch} />
            <SearchField label={t('forms.historySearch')} placeholder={t('forms.historySearch')} value={search} onValueChange={setSearch} />
          </DemoBlock>
          <DemoBlock label={t('forms.fields')} className="flex-col items-stretch">
            <Field label={t('forms.planName')} required error={nameError}>
              <Input
                placeholder={t('forms.planNamePlaceholder')}
                onChange={(e) => setNameError(e.target.value.trim() ? undefined : t('forms.nameError'))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('forms.planType')}>
                <Select
                  placeholder={t('forms.choose')}
                  options={[
                    { value: 'tourism', label: t('forms.tourism') },
                    { value: 'expo', label: t('forms.expo') },
                  ]}
                />
              </Field>
              <Field label={t('forms.startTime')} hint={t('forms.startTimeHint')}>
                <Input type="time" defaultValue="09:00" />
              </Field>
            </div>
            <Field label={t('forms.notes')}>
              <Textarea placeholder={t('forms.notesPlaceholder')} rows={3} />
            </Field>
          </DemoBlock>
        </div>
        <DemoBlock label={t('forms.selection')} className="gap-8">
          <div className="flex items-center gap-2.5">
            <Checkbox id="ds-check" checked={done} onCheckedChange={(v) => setDone(v === true)} />
            <Label htmlFor="ds-check">{t('forms.markCompleted')}</Label>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch id="ds-switch" checked={notify} onCheckedChange={setNotify} />
            <Label htmlFor="ds-switch">{t('forms.reminders')}</Label>
          </div>
        </DemoBlock>
      </GallerySection>

      <GallerySection id="tabs" title={t('sections.tabs.title')} description={t('sections.tabs.description')}>
        <DemoBlock label={t('tabs.segmented')} className="gap-6">
          <SegmentedControl
            label={t('tabs.chatView')}
            value={view}
            onValueChange={setView}
            iconOnly
            options={[
              { value: 'chat', label: t('tabs.chat'), icon: <MessageCircle aria-hidden /> },
              { value: 'map', label: t('tabs.map'), icon: <Map aria-hidden /> },
            ]}
          />
          <SegmentedControl
            label={t('tabs.planView')}
            value={listView}
            onValueChange={setListView}
            options={[
              { value: 'list', label: t('tabs.list'), icon: <List aria-hidden /> },
              { value: 'map', label: t('tabs.map'), icon: <Map aria-hidden /> },
            ]}
          />
        </DemoBlock>
        <DemoBlock label={t('tabs.underline')} className="block">
          <Tabs defaultValue="upcoming">
            <TabsList>
              {(['all', 'upcoming', 'inProgress', 'completed', 'drafts'] as const).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {t(`tabs.plans.${key}`)}
                </TabsTrigger>
              ))}
            </TabsList>
            {(['all', 'upcoming', 'inProgress', 'completed', 'drafts'] as const).map((key) => (
              <TabsContent key={key} value={key}>
                <p className="type-body text-fg-secondary">{t('tabs.panelText', { tab: t(`tabs.plans.${key}`) })}</p>
              </TabsContent>
            ))}
          </Tabs>
        </DemoBlock>
      </GallerySection>

      <GallerySection id="badges" title={t('sections.badges.title')} description={t('sections.badges.description')}>
        <DemoBlock label={t('badges.priority')}>
          <PriorityBadge level="high" />
          <PriorityBadge level="recommended" />
          <PriorityBadge level="optional" />
          <DemoBadge />
        </DemoBlock>
        <DemoBlock label={t('badges.status')}>
          <Badge tone="primary">{t('badges.upcoming')}</Badge>
          <Badge tone="warning">{t('badges.inProgress')}</Badge>
          <Badge tone="success">{t('badges.completed')}</Badge>
          <Badge tone="outline">{t('badges.draft')}</Badge>
          <Badge tone="error">{t('badges.closed')}</Badge>
          <Badge tone="neutral">{t('badges.heritage')}</Badge>
          <Badge tone="arif">{t('badges.arif')}</Badge>
          <Badge tone="roaya">{t('badges.roaya')}</Badge>
        </DemoBlock>
      </GallerySection>

      <GallerySection id="overlays" title={t('sections.overlays.title')} description={t('sections.overlays.description')}>
        <DemoBlock label={t('overlays.triggers')}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="danger">
                <Trash aria-hidden />
                {t('overlays.deletePlan')}
              </Button>
            </DialogTrigger>
            <DialogContent
              closeOnOutsideClick={false}
              title={t('overlays.confirmTitle')}
              description={t('overlays.confirmDescription')}
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="secondary">{t('buttons.cancel')}</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="danger" onClick={() => toast.success(t('overlays.deletedToast'))}>
                      {t('buttons.delete')}
                    </Button>
                  </DialogClose>
                </>
              }
            >
              <p className="type-body text-fg-secondary">{t('overlays.confirmBody')}</p>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">{t('overlays.openFilters')}</Button>
            </SheetTrigger>
            <SheetContent side="bottom" title={t('overlays.filtersTitle')} footer={<Button fullWidth>{t('overlays.showResults')}</Button>}>
              <div className="flex flex-col gap-4">
                {(['family', 'indoor', 'free'] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label htmlFor={`f-${key}`}>{t(`overlays.filters.${key}`)}</Label>
                    <Switch id={`f-${key}`} />
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">{t('overlays.openHistory')}</Button>
            </SheetTrigger>
            <SheetContent side="start" title={t('overlays.historyTitle')}>
              <ul className="flex flex-col gap-1">
                {(['one', 'two', 'three'] as const).map((key) => (
                  <li key={key} className="hover:bg-surface-muted rounded-md px-3 py-2.5 text-[0.9375rem]">
                    {t(`overlays.history.${key}`)}
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <Ellipsis aria-hidden />
                {t('overlays.menu')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Pencil aria-hidden />
                {t('overlays.rename')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <Trash aria-hidden />
                {t('buttons.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip content={t('overlays.tooltipText')}>
            <Button variant="ghost">{t('overlays.hoverMe')}</Button>
          </Tooltip>

          <Button variant="secondary" onClick={() => toast.success(t('overlays.savedToast'), { description: t('overlays.savedToastDescription') })}>
            {t('overlays.showToast')}
          </Button>
        </DemoBlock>
      </GallerySection>

      <GallerySection id="feedback" title={t('sections.feedback.title')} description={t('sections.feedback.description')}>
        <div className="grid gap-4 lg:grid-cols-3">
          <DemoBlock label={t('feedback.loading')} className="flex-col items-stretch gap-3">
            <Skeleton className="aspect-[16/10] w-full rounded-lg" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Spinner />
          </DemoBlock>
          <DemoBlock label={t('feedback.empty')} className="block p-0 sm:p-0">
            <EmptyState
              title={t('feedback.emptyTitle')}
              description={t('feedback.emptyDescription')}
              action={
                <Button variant="gradient" size="sm">
                  <Plus aria-hidden />
                  {t('feedback.createPlan')}
                </Button>
              }
            />
          </DemoBlock>
          <DemoBlock label={t('feedback.error')} className="block p-0 sm:p-0">
            <ErrorState retrying={retrying} onRetry={() => simulate(setRetrying)} />
          </DemoBlock>
        </div>
      </GallerySection>

      <GallerySection id="navigation" title={t('sections.navigation.title')} description={t('sections.navigation.description')}>
        <DemoBlock label={t('navigation.breadcrumbs')}>
          <Breadcrumbs
            items={[
              { label: t('navigation.discover'), href: '#' },
              { label: t('navigation.heritage'), href: '#' },
              { label: t('cards.placeName') },
            ]}
            renderLink={(crumb, children) => (
              <a href={crumb.href} className="focus-ring rounded-xs" onClick={(e) => e.preventDefault()}>
                {children}
              </a>
            )}
          />
        </DemoBlock>
        <DemoBlock label={t('navigation.pagination')}>
          <Pagination page={page} totalPages={10} onPageChange={setPage} />
        </DemoBlock>
      </GallerySection>
    </>
  );
}
