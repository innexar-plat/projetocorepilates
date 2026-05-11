'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { Modal } from '@/components/molecules/Modal';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminTicket } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
type TicketStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_VARIANTS: Record<TicketStatus, 'error' | 'warning' | 'success' | 'info'> = {
  OPEN: 'error', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'info',
};

const FIELD = 'w-full rounded-lg border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] placeholder-[#90a4af] outline-none focus:border-[#3c8ea8] focus:ring-2 focus:ring-[#3c8ea8]/20';

export function AdminSupportContent() {
  const t = useTranslations('admin.support');
  const tc = useTranslations('admin.common');

  const STATUS_LABELS: Record<TicketStatus, string> = {
    OPEN: t('statusOpen'), IN_PROGRESS: t('statusInProgress'),
    RESOLVED: t('statusResolved'), CLOSED: t('statusClosed'),
  };

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<AdminTicket | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tickets = useResource(
    () => adminService.listTickets(page, 20, filterStatus || undefined),
    [page, filterStatus, refreshKey],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function openThread(ticket: AdminTicket) {
    try {
      const full = await adminService.getTicket(ticket.id);
      setSelected(full);
      setReplyText('');
      setShowThread(true);
    } catch {
      showToast(t('toastErrorLoading'));
    }
  }

  async function handleReply() {
    if (!selected || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await adminService.replyTicket(selected.id, replyText.trim());
      // Refresh thread
      const updated = await adminService.getTicket(selected.id);
      setSelected(updated);
      setReplyText('');
      showToast(t('toastReplySent'));
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastReplyError'));
    } finally {
      setIsReplying(false);
    }
  }

  async function handleStatusChange(ticketId: string, status: TicketStatus) {
    setIsUpdatingStatus(true);
    try {
      await adminService.updateTicketStatus(ticketId, status);
      if (selected?.id === ticketId) {
        setSelected((t) => t ? { ...t, status } : t);
      }
      showToast(t('statusUpdated', { label: STATUS_LABELS[status] }));
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastStatusError'));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['', ...STATUS_OPTIONS] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
              filterStatus === s
                ? 'bg-[#3c8ea8] border-[#3c8ea8] text-white'
                : 'border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8]'
            }`}
          >
            {s === '' ? tc('all') : STATUS_LABELS[s]}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#8097a3]">
          {!tickets.isLoading && tickets.data ? t('count', { count: tickets.data.total }) : ''}
        </span>
      </div>

      {tickets.isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : tickets.error ? (
        <ErrorState message={tickets.error} />
      ) : (
        <>
          <DataTable
            keyField="id"
            emptyText={t('noResults')}
            rows={(tickets.data?.data ?? []).map((t) => ({ ...t, _raw: t }))}
            columns={[
              {
                key: 'subject',
                label: 'Assunto',
                render: (v) => <span className="font-medium text-[#1f2e35] max-w-[220px] truncate block">{v as string}</span>,
              },
              {
                key: 'user',
                label: 'Aluno',
                render: (v) => {
                  const u = v as AdminTicket['user'];
                  return (
                    <div>
                      <p className="text-sm text-[#1f2e35]">{u.name}</p>
                      <p className="text-xs text-[#8097a3]">{u.email}</p>
                    </div>
                  );
                },
              },
              { key: 'status', label: t('colStatus'),
                render: (v) => (
                  <StatusBadge
                    label={STATUS_LABELS[v as TicketStatus] ?? (v as string)}
                    variant={STATUS_VARIANTS[v as TicketStatus] ?? 'info'}
                  />
                ),
              },
              { key: 'updatedAt', label: t('colUpdated'),
                render: (v) => new Date(v as string).toLocaleString('en-US'),
              },
              { key: '_raw', label: t('colActions'),
                render: (v) => {
                  const ticket = v as AdminTicket;
                  return (
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => openThread(ticket)}
                        className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors"
                      >
                        {t('btnView')}
                      </button>
                      {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'RESOLVED')}
                          disabled={isUpdatingStatus}
                          className="rounded px-2 py-1 text-xs border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                          {t('btnResolve')}
                        </button>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />

          {(tickets.data?.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-[#d4e2e5] px-3 py-1.5 text-sm text-[#5f7480] disabled:opacity-40 hover:border-[#3c8ea8]">
                {tc('prev')}
              </button>
              <span className="text-sm text-[#8097a3]">{tc('pageOf', { page, total: tickets.data?.totalPages ?? 1 })}</span>
              <button disabled={page === (tickets.data?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[#d4e2e5] px-3 py-1.5 text-sm text-[#5f7480] disabled:opacity-40 hover:border-[#3c8ea8]">
                {tc('next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Thread Modal */}
      <Modal
        title={selected ? t('threadTitle', { subject: selected.subject }) : t('threadFallback')}
        open={showThread}
        onClose={() => setShowThread(false)}
        size="lg"
        footer={
          <button onClick={() => setShowThread(false)} className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]">
            {tc('close')}
          </button>
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium text-[#1f2e35]">{selected.user.name}</p>
                <p className="text-xs text-[#8097a3]">{selected.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={STATUS_LABELS[selected.status as TicketStatus] ?? selected.status}
                  variant={STATUS_VARIANTS[selected.status as TicketStatus] ?? 'info'}
                />
                <select
                  className="rounded-lg border border-[#d4e2e5] px-3 py-1.5 text-xs text-[#5f7480] outline-none focus:border-[#3c8ea8]"
                  value={selected.status}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleStatusChange(selected.id, e.target.value as TicketStatus)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages thread */}
            <div className="max-h-[340px] overflow-y-auto space-y-3 rounded-lg bg-[#f7fbfc] p-4">
                {selected.messages.length === 0 ? (
                <p className="text-sm text-[#8097a3] text-center py-4">{t('noMessages')}</p>
              ) : (
                selected.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${msg.isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.isAdmin
                          ? 'bg-[#3c8ea8] text-white rounded-br-sm'
                          : 'bg-white border border-[#d4e2e5] text-[#1f2e35] rounded-bl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <p className="text-xs text-[#8097a3]">
                      {msg.isAdmin ? t('senderSupport') : selected.user.name} \u00b7 {new Date(msg.createdAt).toLocaleString('en-US')}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Reply box */}
            {selected.status !== 'RESOLVED' && selected.status !== 'CLOSED' && (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  className={`${FIELD} resize-none`}
                  placeholder={t('replyPlaceholder')}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleReply}
                    disabled={isReplying || !replyText.trim()}
                    className="rounded-lg bg-[#3c8ea8] px-5 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50"
                  >
                    {isReplying ? tc('sending') : tc('reply')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}

