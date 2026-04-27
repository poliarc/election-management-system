import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';  

export interface Market {
  id: number;
  state: string;
  district: string;
  assembly?: string;
  block?: string;
  mandal?: string;
  business_name?: string; 
  nature_of_business?: string;
  business_category?: string;
  business_sub_category?: string;
  owner_name: string;
  contact_number?: string;
  alternative_number?: string;
  email_id?: string;
  website?: string;
  fb_link?: string;
  twitter_link?: string;
  instagram_link?: string;
  linkedin_link?: string;
  youtube_link?: string;
}

// --- Configuration for Categories and Sub-categories ---
const categoriesData: Record<string, string[]> = {
  "Electronics": ["Mobile Store", "Home Appliances", "Computer Hardware", "Repair Services"],
  "Automobile": ["Two Wheeler Dealer", "Four Wheeler Dealer", "Spare Parts", "Service Center"],
  "IT Services": ["Software Development", "Web Design", "Digital Marketing", "Cloud Services"],
  "Retail": ["Grocery", "Clothing", "Footwear", "Stationery"],
  "Healthcare": ["Pharmacy", "Clinic", "Diagnostic Center", "Hospital"],
  "Food & Beverage": ["Restaurant", "Cafe", "Bakery", "Catering"]
};

const getCategoryStyle = (category: string = '') => {
  if (!category) {
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }
  switch (category.toLowerCase()) {
    case 'electronics': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'automobile': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    case 'it services': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    default: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }
};

const iconClass = "h-4 w-4 text-indigo-500 shrink-0";

const MarketTable = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [formData, setFormData] = useState<Partial<Market>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/market/get-market`);
      const result = await response.json();
      
      if (result.success) {
        setMarkets(result.data);
      } else {
        toast.error(result.message || "Failed to load markets");
      }
    } catch (error) {
      toast.error("Network error while fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const toggleRow = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenCreate = () => {
    setFormData({});
    setModalMode('create');
  };

  const handleOpenUpdate = (market: Market) => {
    setFormData(market);
    setModalMode('edit');
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Logic: If category changes, reset the sub-category
    if (name === 'business_category') {
      setFormData(prev => ({ 
        ...prev, 
        business_category: value, 
        business_sub_category: "" 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEditing = modalMode === 'edit';
    const url = isEditing 
      ? `${import.meta.env.VITE_API_BASE_URL}/api/market/update-market/${formData.id}`
      : `${import.meta.env.VITE_API_BASE_URL}/api/market/create-market`;
    const method = isEditing ? 'PATCH' : 'POST';

    let payloadToSend: any = { ...formData };

    Object.keys(payloadToSend).forEach(key => {
      if (typeof payloadToSend[key] === 'string') {
        payloadToSend[key] = payloadToSend[key].trim();
      }
      if (payloadToSend[key] === "" || payloadToSend[key] === null) {
        delete payloadToSend[key]; 
      }
    });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSend) 
      });
      
      const result = await response.json();

      if (result.success) {
        toast.success(`Market ${isEditing ? 'updated' : 'created'} successfully!`);
        setModalMode(null);
        fetchMarkets();
      } else {
        const errorMessage = result.error?.details?.[0]?.message || result.message || `Failed to ${isEditing ? 'update' : 'create'} market`;
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Network error while submitting data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (markets.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const headers = [
        "State", "District", "Assembly", "Block", "Mandal", 
        "Business Name", "Nature of Business", "Category", "Sub-Category",
        "Owner Name", "Primary Contact", "Alternate Contact", "Email ID", 
        "Website", "LinkedIn", "Facebook", "Instagram", "Twitter", "YouTube"
      ];

      const csvRows = markets.map(market => [
        `"${market.state || "—"}"`, 
        `"${market.district || "—"}"`, 
        `"${market.assembly || "—"}"`,
        `"${market.block || "—"}"`,
        `"${market.mandal || "—"}"`,
        `"${market.business_name || "—"}"`,
        `"${market.nature_of_business || "—"}"`,
        `"${market.business_category || "—"}"`, 
        `"${market.business_sub_category || "—"}"`,
        `"${market.owner_name || "—"}"`, 
        `"${market.contact_number || "—"}"`,
        `"${market.alternative_number || "—"}"`, 
        `"${market.email_id || "—"}"`,
        `"${market.website || "—"}"`,
        `"${market.linkedin_link || "—"}"`,
        `"${market.fb_link || "—"}"`,
        `"${market.instagram_link || "—"}"`,
        `"${market.twitter_link || "—"}"`,
        `"${market.youtube_link || "—"}"`
      ]);

      const csvContent = [headers.join(","), ...csvRows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "Market_Directory_Export.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export successful");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-[var(--bg-main)] relative">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Market Directory</h2>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            View and manage local business listings and owner details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 text-sm font-bold transition-all active:scale-95 shadow-sm"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Market
          </button>

          <button 
            onClick={handleExport}
            disabled={isExporting || markets.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
      
      {/* Table Section */}
      <div className="overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm rounded-2xl flex-1">
        <div className="overflow-x-auto h-full">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-[var(--bg-main)]/50 border-b border-[var(--border-color)]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">State</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">District</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Assembly</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Business Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">Loading market data...</td></tr>
              ) : markets.length === 0 ? (
                 <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">No markets found.</td></tr>
              ) : (
                markets.map((market) => (
                  <React.Fragment key={market.id}>
                    <tr className={`transition-colors group cursor-pointer ${expandedId === market.id ? 'bg-[var(--bg-main)]' : 'hover:bg-[var(--bg-hover)]'}`} onClick={() => toggleRow(market.id)}>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="text-[var(--text-color)] text-sm font-medium">{market.state}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="text-[var(--text-color)] text-sm font-medium">{market.district}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="text-[var(--text-color)] text-sm font-medium">{market.assembly}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getCategoryStyle(market.business_category)}`}>
                          {market.business_category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                            {market.business_name ? market.business_name.charAt(0).toUpperCase() : 'B'}
                          </div>
                          <span className="text-[var(--text-color)] font-bold text-sm tracking-tight">{market.business_name || 'Unnamed Business'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleRow(market.id); }}
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-all ${
                            expandedId === market.id 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:bg-indigo-50 hover:text-indigo-600'
                          }`}
                        >
                          <svg className={`h-4 w-4 transition-transform duration-300 ${expandedId === market.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {expandedId === market.id && (
                      <tr className="bg-[var(--bg-main)]">
                        <td colSpan={6} className="p-0 border-b border-[var(--border-color)]">
                          <div className="m-4 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
                              
                              <div>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Phone Numbers</p>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                    <span className="text-sm font-medium text-[var(--text-color)]">{market.contact_number || '—'}</span>
                                  </div>
                                  {market.alternative_number && (
                                    <div className="flex items-center gap-2">
                                      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                      <span className="text-sm font-medium text-[var(--text-color)]">{market.alternative_number}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Owner Name</p>
                                <div className="flex items-center gap-2">
                                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                  <span className="text-sm font-bold text-[var(--text-color)]">{market.owner_name}</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Sub-Category</p>
                                <div className="flex items-center gap-2">
                                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                  <span className="text-sm font-medium text-[var(--text-color)]">{market.business_sub_category || '—'}</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Digital Presence</p>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    {market.email_id ? (
                                      <a href={`mailto:${market.email_id}`} className="text-sm font-medium text-indigo-500 hover:underline truncate">{market.email_id}</a>
                                    ) : <span className="text-sm text-[var(--text-secondary)]">—</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                                    {market.website ? (
                                      <a href={market.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-500 hover:underline truncate">{market.website}</a>
                                    ) : <span className="text-sm text-[var(--text-secondary)]">—</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="sm:col-span-2 lg:col-span-4 mt-2 pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Location Details</p>
                                  <div className="flex items-start gap-2">
                                    <svg className={`${iconClass} mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    <div>
                                      <p className="text-xs text-[var(--text-secondary)] font-medium">Block: <span className="text-[var(--text-color)]">{market.block || '—'}</span> &nbsp;•&nbsp; Mandal: <span className="text-[var(--text-color)]">{market.mandal || '—'}</span></p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="w-full sm:w-auto flex justify-end">
                                  <button 
                                    onClick={() => handleOpenUpdate(market)}
                                    className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-sm bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
                                  >
                                    Update Details
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Unified Create/Update Modal Overlay --- */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col border border-[var(--border-color)]">
            
            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--text-color)]">
                {modalMode === 'create' ? 'Add New Market Listing' : 'Edit Market Listing'}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="md:col-span-3 border-b border-[var(--border-color)] pb-2">
                  <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">Location Information</h4>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">State *</label>
                  <input type="text" name="state" required value={formData.state || ''} onChange={handleModalChange} className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">District *</label>
                  <input type="text" name="district" required value={formData.district || ''} onChange={handleModalChange} className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Assembly *</label>
                  <input type="text" name="assembly" required value={formData.assembly || ''} onChange={handleModalChange} className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Block</label>
                  <input type="text" name="block" value={formData.block || ''} onChange={handleModalChange} className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Mandal</label>
                  <input type="text" name="mandal" value={formData.mandal || ''} onChange={handleModalChange} className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="md:col-span-3 border-b border-[var(--border-color)] pb-2 mt-4">
                  <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">Business Details</h4>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Business Name</label>
                  <input type="text" name="business_name" value={formData.business_name || ''} onChange={handleModalChange} placeholder="e.g. Royal Awadh Handicrafts" className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Nature of Business</label>
                  <input type="text" name="nature_of_business" value={formData.nature_of_business || ''} onChange={handleModalChange} placeholder="e.g. Retail, Wholesale" className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>

                {/* --- Business Category Dropdown --- */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Business Category</label>
                  <select 
                    name="business_category" 
                    value={formData.business_category || ''} 
                    onChange={handleModalChange} 
                    className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categoriesData).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* --- Sub-Category Dropdown (Dependent on Category) --- */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Sub-Category</label>
                  <select 
                    name="business_sub_category" 
                    disabled={!formData.business_category}
                    value={formData.business_sub_category || ''} 
                    onChange={handleModalChange} 
                    className={`w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none ${!formData.business_category ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Sub-Category</option>
                    {formData.business_category && categoriesData[formData.business_category]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3 border-b border-[var(--border-color)] pb-2 mt-4">
                  <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">Owner & Contact Information</h4>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Owner Name *</label>
                  <input type="text" name="owner_name" required value={formData.owner_name || ''} onChange={handleModalChange} className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Primary Contact No.</label>
                  <input type="text" name="contact_number" value={formData.contact_number || ''} onChange={handleModalChange} placeholder="10-15 digits" className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Alternate Contact No.</label>
                  <input type="text" name="alternative_number" value={formData.alternative_number || ''} onChange={handleModalChange} className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Email ID</label>
                  <input type="email" name="email_id" value={formData.email_id || ''} onChange={handleModalChange} className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="md:col-span-3 border-b border-[var(--border-color)] pb-2 mt-4">
                  <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Digital & Social Presence
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Website URL</label>
                  <input type="url" name="website" value={formData.website || ''} onChange={handleModalChange} placeholder="https://..." className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">LinkedIn Profile</label>
                  <input type="url" name="linkedin_link" value={formData.linkedin_link || ''} onChange={handleModalChange} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Facebook Page</label>
                  <input type="url" name="fb_link" value={formData.fb_link || ''} onChange={handleModalChange} placeholder="https://facebook.com/..." className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Instagram Handle</label>
                  <input type="url" name="instagram_link" value={formData.instagram_link || ''} onChange={handleModalChange} placeholder="https://instagram.com/..." className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Twitter (X) Link</label>
                  <input type="url" name="twitter_link" value={formData.twitter_link || ''} onChange={handleModalChange} placeholder="https://x.com/..." className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">YouTube Channel</label>
                  <input type="url" name="youtube_link" value={formData.youtube_link || ''} onChange={handleModalChange} placeholder="https://youtube.com/@..." className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-[var(--text-secondary)] opacity-80" />
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setModalMode(null)} className="px-6 py-2.5 text-sm font-semibold text-[var(--text-color)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md disabled:opacity-50 border border-indigo-600">
                  {isSubmitting ? "Processing..." : modalMode === 'create' ? "Create Listing" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketTable;