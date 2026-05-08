'use client';

import { useState, useCallback } from 'react';
import { useResource } from '@/hooks/use-resource';
import { portalService, type SupportTicket } from '@/services/portal.service';
import { Modal } from '@/components/molecules/Modal';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useTranslations } from 'next-intl';

const STATUS_VARIANTS: Record<string, 'error' | 'warning' | 'success' | 'info'> = {
  OPEN: 'error', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'info',
};

const FIELD = 'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#6b8e6a] focus:ring-2 focus:ring-[#6b8e6a]/20';
const LABEL = 'block text-xs font-medium text-gray-500 mb-1';

export function PortalSupportContent() {
  const t = useTranslations('portal.support');
  const tc = useTranslations('common');

  const STATUS_LABELS: Record<string, string> = {
    OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed',
  };

  const [showNew, setShowNew] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newErrors, setNewErrors] = useState<Record<string, string>>({});

  const tickets = useResource(() => portalService.listTickets(), [refreshKey]);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function openThread(ticket: SupportTicket) {
    try {
      const full = await portalService.getTicket(ticket.id);
      setSelected(full);
      setReplyText('');
      setShowThread(true);
    } catch {
      showToast(t('errorLoading'));
    }
  }

  function validateNew() {
    const e: Record<string, string> = {};
    if (!newSubject.trim() || newSubject.length < 5) e.subject = t('subjectMin');
    if (!newMessage.trim() || newMessage.length < 10) e.message = t('messageMin');
    setNewErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validateNew()) return;
    setIsSubmitting(true);
    try {
      await portalService.createTicket(newSubject.trim(), newMessage.trim());
      showToast(t('successOpen'));
      setShowNew(false);
      setNewSubject('');
      setNewMessage('');
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('errorOpen'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReply() {
    if (!selected || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await portalService.replyTicket(selected.id, replyText.trim());
      const updated = await portalService.getTicket(selected.id);
      setSelected(updated);
      setReplyText('');
      showToast(t('successReply'));
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('errorReply'));
    } finally {
      setIsReplying(false);
    }
  }

  const list = tickets.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{t('title')}</h2>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { setShowNew(true); setNewSubject(''); setNewMessage(''); setNewErrors({}); }}
          className="flex items-center gap-2 rounded-xl bg-[#6b8e6a] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#5a7a59] transition-colors"
        >
          <span className="text-base leading-none">+</span> {t('newTicket')}
        </button>
      </div>

      {tickets.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-3xl mb-3">🎧</p>
          <p className="text-sm font-medium text-gray-600">{t('empty')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('emptyHint')}</p>
          <button onClick={() => setShowNew(true)} className="mt-4 rounded-xl bg-[#6b8e6a] px-5 py-2 text-sm font-medium text-white hover:bg-[#5a7a59]">
            {t('openFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-4 hover:border-[#6b8e6a]/40 transition-colors cursor-pointer"
              onClick={() => openThread(ticket)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{ticket.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('updatedAt', { date: new Date(ticket.updatedAt).toLocaleString('en-US') })}
                </p>
              </div>
              <StatusBadge
                label={STATUS_LABELS[ticket.status] ?? ticket.status}
                variant={STATUS_VARIANTS[ticket.status] ?? 'info'}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Novo Chamado Modal ───────────────────────────────────────────── */}
      <Modal
        title={t('openTicket')}
        open={showNew}
        onClose={() => setShowNew(false)}
        size="md"
        footer={
          <>
            <button onClick={() => setShowNew(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">
              {tc('cancel')}
            </button>
            <button onClick={handleCreate} disabled={isSubmitting} className="rounded-xl bg-[#6b8e6a] px-5 py-2 text-sm font-medium text-white hover:bg-[#5a7a59] disabled:opacity-50">
              {isSubmitting ? '...' : t('openButton')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={LABEL}>{t('subject')}</label>
              <input className={FIELD} placeholder={t('subjectPlaceholder')}
              value={newSubject}
              onChange={(e) => { setNewSubject(e.target.value); setNewErrors((er) => ({ ...er, subject: '' })); }}
            />
            {newErrors.subject && <p className="mt-1 text-xs text-red-500">{newErrors.subject}</p>}
          </div>
          <div>
            <label className={LABEL}>{t('message')}</label>
              <textarea rows={5} className={`${FIELD} resize-none`} placeholder={t('messagePlaceholder')}
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); setNewErrors((er) => ({ ...er, message: '' })); }}
            />
            {newErrors.message && <p className="mt-1 text-xs text-red-500">{newErrors.message}</p>}
          </div>
        </div>
      </Modal>

      {/* ── Thread Modal ─────────────────────────────────────────────────── */}
      <Modal
        title={selected ? selected.subject : t('ticketFallback')}
        open={showThread}
        onClose={() => setShowThread(false)}
        size="lg"
        footer={
          <button onClick={() => setShowThread(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">
            {tc('close')}
          </button>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge
                label={STATUS_LABELS[selected.status] ?? selected.status}
                variant={STATUS_VARIANTS[selected.status] ?? 'info'}
              />
                <span className="text-xs text-gray-400">
                {t('openedAt', { date: new Date(selected.createdAt).toLocaleString('en-US') })}
              </span>
            </div>

            {/* Messages thread */}
            <div className="max-h-[340px] overflow-y-auto space-y-3 rounded-xl bg-gray-50 p-4">
              {selected.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${msg.isAdmin ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.isAdmin
                        ? 'bg-[#6b8e6a] text-white rounded-tl-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                    <p className="text-xs text-gray-400">
                      {msg.isAdmin ? t('supportTeam') : t('you')} · {new Date(msg.createdAt).toLocaleString('en-US')}
                    </p>
                </div>
              ))}
            </div>

            {/* Reply */}
            {selected.status !== 'RESOLVED' && selected.status !== 'CLOSED' && (
              <div className="space-y-2">
                <textarea rows={3} className={`${FIELD} resize-none`} placeholder={t('replyPlaceholder')}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleReply}
                    disabled={isReplying || !replyText.trim()}
                    className="rounded-xl bg-[#6b8e6a] px-5 py-2 text-sm font-medium text-white hover:bg-[#5a7a59] disabled:opacity-50"
                  >
                    {isReplying ? tc('sending') : tc('send')}
                  </button>
                </div>
              </div>
            )}

            {(selected.status === 'RESOLVED' || selected.status === 'CLOSED') && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700 text-center">
                {t('resolved', { status: STATUS_LABELS[selected.status]?.toLowerCase() ?? selected.status })}
              </div>
            )}
          </div>
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-gray-800 px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
