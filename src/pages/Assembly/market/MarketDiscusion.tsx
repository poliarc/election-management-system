// Location: src/pages/Assembly/market/MarketDiscusion.tsx
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// 1. Import functions
import {
  fetchMarketDiscussions,
  createMarketDiscussion,
  updateMarketDiscussion
} from "./../../../store/api/marketDiscussion.api";

// 2. Import Types
import type {
  MarketDiscussionData,
  MarketDiscussionPayload
} from "./../../../store/api/marketDiscussion.api";

interface Market {
  id: number;
  state: string;
  district: string;
  assembly?: string;
  business_name?: string;
  owner_name: string;
  contact_number?: string;
  mandal?: string;
}

const getStatusStyle = (status: string = 'PENDING') => {
  switch (status.toUpperCase()) {
    case 'INTERESTED':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'DISCUSS LATER':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'NOT INTERESTED':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    case 'PENDING':
    default:
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
  }
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr.replace(' ', 'T')); // Safe parse for SQL dates
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MarketDiscussionTable = () => {
  const { t } = useTranslation();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [discussions, setDiscussions] = useState<MarketDiscussionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MarketDiscussionData & { contact_person_phone?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference to scroll the modal to the top when editing a previous discussion
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const getCurrentDateTimeString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getStatusLabel = (status?: string) => {
    switch ((status || 'PENDING').toUpperCase()) {
      case 'INTERESTED':
        return t('marketDiscussion.statusInterested');
      case 'DISCUSS LATER':
        return t('marketDiscussion.statusDiscussLater');
      case 'NOT INTERESTED':
        return t('marketDiscussion.statusNotInterested');
      case 'PENDING':
      default:
        return t('marketDiscussion.statusPending');
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [marketRes, discRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/market/get-market`).then(res => res.json()),
        fetchMarketDiscussions({ limit: 1000 })
      ]);

      if (marketRes.success) setMarkets(marketRes.data || []);
      if (discRes.success) setDiscussions(discRes.data || []);
    } catch (error: any) {
      toast.error(t('marketDiscussion.toastNetworkError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tableData = markets.map(market => {
    const marketDiscussions = discussions
      .filter(d => Number(d.market_id) === Number(market.id))
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

    const latestDisc = marketDiscussions.length > 0 ? marketDiscussions[0] : null;

    return {
      market,
      latest: latestDisc,
      totalLogs: marketDiscussions.length
    };
  });

  // Open form in "Create New" mode
  const handleOpenForm = (marketId: number, latest: MarketDiscussionData | null) => {
    if (latest) {
      const prefilledData = { ...latest };
      // Delete IDs so it creates a NEW log with pre-filled previous data
      delete prefilledData.id;
      delete prefilledData.created_at;
      delete prefilledData.updated_on;
      delete prefilledData.updated_by_name;
      setFormData({ ...prefilledData, market_id: marketId });
    } else {
      setFormData({ status: 'PENDING', market_id: marketId });
    }
    setIsModalOpen(true);
  };

  // Switch to "Edit" mode for a specific historical record
  const handleEditHistory = (hist: MarketDiscussionData) => {
    setFormData(hist);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cancel edit mode and return to "Create New" mode
  const handleCancelEdit = () => {
    const marketId = formData.market_id;
    if (marketId) {
      // Find the latest to prefill
      const marketDiscussions = discussions
        .filter(d => Number(d.market_id) === Number(marketId))
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      handleOpenForm(marketId, marketDiscussions[0] || null);
    }
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = (type === 'number' && name !== 'contact_person_phone') ? (value ? Number(value) : undefined) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let payloadToSend: any = { ...formData };

      const isEditing = !!payloadToSend.id;
      const updateId = payloadToSend.id;

      delete payloadToSend.id;
      delete payloadToSend.created_at;
      delete payloadToSend.updated_on;
      delete payloadToSend.updated_by_name;

      if (payloadToSend.discussion_scheduled_on) {
        payloadToSend.discussion_scheduled_on = payloadToSend.discussion_scheduled_on.replace('T', ' ');
        if (payloadToSend.discussion_scheduled_on.length === 16) {
          payloadToSend.discussion_scheduled_on += ':00';
        }
      }

      Object.keys(payloadToSend).forEach(key => {
        if (payloadToSend[key] === "" || payloadToSend[key] === null || payloadToSend[key] === undefined) {
          delete payloadToSend[key];
        }
      });

      if (isEditing) {
        await updateMarketDiscussion(updateId, payloadToSend);
        toast.success(t('marketDiscussion.toastPastRecordUpdated'));
      } else {
        await createMarketDiscussion(payloadToSend as MarketDiscussionPayload);
        toast.success(t('marketDiscussion.toastNewFollowUpLogged'));
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || t('marketDiscussion.toastFailedToSave'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMarket = markets.find(m => m.id === formData.market_id);
  const inputClass = "w-full px-3 py-2.5 sm:py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all";
  const isScheduleMandatory = formData.status === 'INTERESTED' || formData.status === 'DISCUSS LATER';
  const isEditingOldRecord = !!formData.id;

  // Grab past discussions for this market, excluding the one currently being edited (so it doesn't show in the list while editing it)
  const previousDiscussions = formData.market_id
    ? discussions
        .filter(d => Number(d.market_id) === Number(formData.market_id) && Number(d.id) !== Number(formData.id))
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    : [];

  return (
    <div className="p-2 sm:p-4 md:p-6 h-full flex flex-col bg-[var(--bg-main)] relative">
      <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-6 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{t('marketDiscussion.title')}</h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 opacity-90">{t('marketDiscussion.description')}</p>
        </div>
      </div>

      <div className="overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm rounded-xl sm:rounded-2xl flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="min-w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[var(--bg-main)]/50 border-b border-[var(--border-color)] sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('marketDiscussion.state')}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('marketDiscussion.district')}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('marketDiscussion.assembly')}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('marketDiscussion.businessName')}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('marketDiscussion.status')}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('marketDiscussion.followUpDate')}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">{t('marketDiscussion.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 sm:px-6 sm:py-12 text-center text-[var(--text-secondary)] text-sm">{t('marketDiscussion.loadingData')}</td></tr>
              ) : tableData.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 sm:px-6 sm:py-12 text-center text-[var(--text-secondary)] text-sm">{t('marketDiscussion.noBusinessesFound')}</td></tr>
              ) : (
                tableData.map(({ market, latest, totalLogs }) => (
                  <tr key={market.id} className="transition-colors hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className="text-[var(--text-color)] text-sm font-medium">{market.state}</span>
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className="text-[var(--text-color)] text-sm font-medium">{market.district}</span>
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className="text-[var(--text-color)] text-sm font-medium">{market.assembly || '—'}</span>
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                          {market.business_name ? market.business_name.charAt(0).toUpperCase() : t('marketDiscussion.businessInitialFallback')}
                        </div>
                        <div>
                          <p className="text-[var(--text-color)] font-bold text-sm">
                            {market.business_name || market.owner_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 sm:px-3 rounded-full text-xs font-bold border ${getStatusStyle(latest?.status || 'PENDING')}`}>
                        {getStatusLabel(latest?.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className="text-[var(--text-color)] text-sm font-medium">
                        {formatDateTime(latest?.discussion_scheduled_on)}
                      </span>
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                      <button
                        onClick={() => handleOpenForm(market.id, latest as MarketDiscussionData | null)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 border ${
                          totalLogs === 0
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {totalLogs === 0 ? t('marketDiscussion.addLog') : t('marketDiscussion.update')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-[var(--bg-card)] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[95vh] overflow-hidden flex flex-col border border-[var(--border-color)] animate-slide-up sm:animate-fade-in">
            <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                {isEditingOldRecord ? (
                  <><span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> {t('marketDiscussion.editPastRecord')}</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {t('marketDiscussion.addNewFollowUp')}</>
                )}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors p-1" aria-label={t('marketDiscussion.close')}>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Added ref here to control scrolling */}
            <div ref={modalScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar scroll-smooth">
              <form onSubmit={handleSubmit} className={isEditingOldRecord ? 'p-4 -m-4 bg-sky-50/50 dark:bg-sky-900/10 rounded-xl transition-all duration-300' : 'transition-all duration-300'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('marketDiscussion.targetBusiness')}</label>
                    <div className="w-full px-3 py-2.5 sm:py-2 bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-base sm:text-sm opacity-80 select-none font-medium truncate">
                      {selectedMarket ? `#${selectedMarket.id} - ${selectedMarket.business_name || selectedMarket.owner_name}` : t('marketDiscussion.unknownBusiness')}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('marketDiscussion.contactPersonName')}</label>
                    <input
                      type="text"
                      name="contact_person_name"
                      value={formData.contact_person_name || ''}
                      onChange={handleModalChange}
                      placeholder={t('marketDiscussion.placeholderContactPersonName')}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('marketDiscussion.contactPersonPhone')}</label>
                    <input
                      type="tel"
                      name="contact_person_phone"
                      value={formData.contact_person_phone || ''}
                      onChange={handleModalChange}
                      placeholder={t('marketDiscussion.placeholderContactPersonPhone')}
                      className={`${inputClass} font-mono`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('marketDiscussion.statusRequired')}</label>
                    <select name="status" required value={formData.status || 'PENDING'} onChange={handleModalChange as any} className={inputClass}>
                      <option value="PENDING">{t('marketDiscussion.statusPending')}</option>
                      <option value="DISCUSS LATER">{t('marketDiscussion.statusDiscussLater')}</option>
                      <option value="INTERESTED">{t('marketDiscussion.statusInterested')}</option>
                      <option value="NOT INTERESTED">{t('marketDiscussion.statusNotInterested')}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                      {t('marketDiscussion.scheduleFollowUp')} {isScheduleMandatory && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="datetime-local"
                      name="discussion_scheduled_on"
                      required={isScheduleMandatory}
                      value={formData.discussion_scheduled_on ? formData.discussion_scheduled_on.slice(0, 16) : ''}
                      onChange={handleModalChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('marketDiscussion.peopleInfluenced')}</label>
                    <input type="number" name="person_influenced" min="0" value={formData.person_influenced ?? ''} onChange={handleModalChange} className={inputClass} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('marketDiscussion.currentPartyAssociated')}</label>
                    <input type="text" name="current_party_associated" value={formData.current_party_associated || ''} onChange={handleModalChange} placeholder={t('marketDiscussion.placeholderCurrentParty')} className={inputClass} />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('marketDiscussion.discussionRemarksRequired')}</label>
                    <textarea name="discussion_remarks" required rows={4} value={formData.discussion_remarks || ''} onChange={handleModalChange as any} className={`${inputClass} resize-none`} placeholder={t('marketDiscussion.placeholderDiscussionRemarks')} />
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-[var(--border-color)]">
                  {isEditingOldRecord ? (
                    <button type="button" onClick={handleCancelEdit} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                      {t('marketDiscussion.cancelEdit')}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm font-semibold text-[var(--text-color)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
                      {t('marketDiscussion.close')}
                    </button>
                  )}

                  <button type="submit" disabled={isSubmitting} className={`w-full sm:w-auto px-8 py-3 sm:py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-md disabled:opacity-50 border ${isEditingOldRecord ? 'bg-sky-600 hover:bg-sky-700 border-sky-600' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'}`}>
                    {isSubmitting ? t('marketDiscussion.saving') : isEditingOldRecord ? t('marketDiscussion.updateRecord') : t('marketDiscussion.saveDiscussion')}
                  </button>
                </div>
              </form>

              {/* --- History visible at the bottom --- */}
              {previousDiscussions.length > 0 && (
                <div className="mt-8 border-t border-[var(--border-color)] pt-6">
                  <h4 className="text-sm font-bold text-[var(--text-color)] mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('marketDiscussion.previousDiscussions')}
                  </h4>

                  <div className="space-y-3">
                    {previousDiscussions.map((hist) => (
                      <div key={hist.id} className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] shadow-sm hover:border-sky-300 transition-colors group">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusStyle(hist.status)}`}>
                              {getStatusLabel(hist.status)}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)] font-medium">
                              {formatDateTime((hist as any).created_at || (hist as any).updated_on)}
                            </span>
                          </div>

                          {/* EDIT BUTTON ON HISTORY CARD */}
                          <button
                            onClick={() => handleEditHistory(hist)}
                            className="text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded border border-sky-200 transition-all opacity-80 group-hover:opacity-100"
                          >
                            {t('marketDiscussion.edit')}
                          </button>
                        </div>
                        <p className="text-[var(--text-color)] text-sm mb-3 pr-2">
                          {hist.discussion_remarks || t('marketDiscussion.noRemarksProvided')}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] p-2.5 rounded-lg border border-[var(--border-color)]">
                          {hist.contact_person_name && (
                            <span className="flex items-center gap-1">
                              <strong className="font-semibold text-[var(--text-color)]">{t('marketDiscussion.contact')}:</strong>
                              {hist.contact_person_name} {hist.contact_person_phone ? `(${hist.contact_person_phone})` : ''}
                            </span>
                          )}
                          {hist.discussion_scheduled_on && (
                            <span className="flex items-center gap-1">
                              <strong className="font-semibold text-[var(--text-color)]">{t('marketDiscussion.followUp')}:</strong>
                              {formatDateTime(hist.discussion_scheduled_on)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDiscussionTable;
