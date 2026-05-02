import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import type { ProgramStatus } from "./types";
import { createProgramPublic, getProgramLinkById } from "../../../services/programApi";
import type { ProgramLink } from "../../../services/programApi";

const STATUS_OPTIONS: ProgramStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETE', 'MISSED'];

export default function PublicAddProgramPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const safeNum = (key: string) => { const v = Number(searchParams.get(key)); return isNaN(v) ? 0 : v; };
  const linkId      = safeNum('link_id');
  const stateIdP    = safeNum('state_id');
  const districtIdP = safeNum('district_id');
  const assemblyIdP = safeNum('assembly_id');
  const candidateIdP= safeNum('candidate_id');
  const creatorIdP  = safeNum('creator_id');
  const partyIdP    = safeNum('party_id');

  const hasAllParams = !!(stateIdP && assemblyIdP && creatorIdP);

  const [linkData, setLinkData] = useState<ProgramLink | null>(
    hasAllParams ? {
      id: linkId,
      party_id: partyIdP,
      state_id: stateIdP,
      district_id: districtIdP,
      assembly_id: assemblyIdP,
      candidate_id: candidateIdP,
      creator_id: creatorIdP,
    } : null
  );
  const [linkLoading, setLinkLoading] = useState(!hasAllParams);
  const [linkError, setLinkError] = useState(false);

  useEffect(() => {
    if (hasAllParams || !linkId) {
      setLinkLoading(false);
      if (!hasAllParams && !linkId) setLinkError(true);
      return;
    }
    getProgramLinkById(linkId)
      .then(data => {
        if (data) {
          setLinkData(data);
        } else {
          setLinkError(true);
        }
      })
      .catch(() => setLinkError(true))
      .finally(() => setLinkLoading(false));
  }, [linkId, hasAllParams]);

  const [programName, setProgramName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProgramStatus>('PENDING');
  const [creatorName, setCreatorName] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (linkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">{t("PublicAddProgramPage.Loading")}</div>
      </div>
    );
  }

  if (!linkId || linkError || !linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">{t("PublicAddProgramPage.Invalid_Link")}</p>
          <p className="text-sm mt-1">{t("PublicAddProgramPage.Invalid_Link_Desc")}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createProgramPublic({
        program_name: programName,
        isActive: 1,
        managers: [{
          party_id: Number(linkData.party_id) || Number((linkData as any).party?.id) || 0,
          state_id: Number(linkData.state_id),
          district_id: Number(linkData.district_id),
          assembly_id: Number(linkData.assembly_id),
          candidate_id: Number(linkData.candidate_id),
          location,
          date,
          time,
          description,
          status,
          created_by: creatorName,
          creator_phone_no: creatorPhone,
          creator_id: Number(linkData.creator_id),
          isActive: 1,
        }],
      });
      if (res.success) {
        setSubmitted(true);
      } else {
        toast.error(res.message || 'Failed to submit program');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit program');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition";
  const disabledCls = "w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  const stateName   = searchParams.get('state_name')    || (linkData as any)?.state?.name    || String(linkData?.state_id    || '');
  const districtName= searchParams.get('district_name') || (linkData as any)?.district?.name || String(linkData?.district_id  || '');
  const assemblyName= searchParams.get('assembly_name') || (linkData as any)?.assembly?.name || String(linkData?.assembly_id  || '');
  const candidateName = searchParams.get('candidate_name') || ((linkData as any)?.candidate
    ? `${(linkData as any).candidate.first_name} ${(linkData as any).candidate.last_name}`.trim()
    : '');

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{t("PublicAddProgramPage.Submitted_Title")}</h2>
          <p className="text-sm text-gray-500 mt-2">{t("PublicAddProgramPage.Submitted_Desc")}</p>
          <button
            onClick={() => {
              setProgramName('');
              setLocation('');
              setDate('');
              setTime('');
              setDescription('');
              setStatus('PENDING');
              setCreatorName('');
              setCreatorPhone('');
              setSubmitted(false);
            }}
            className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            + Add Another Program
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800">{t("PublicAddProgramPage.Title")}</h1>
            <p className="text-sm text-gray-500 mt-1">{t("PublicAddProgramPage.Subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("PublicAddProgramPage.Location_Info")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>{t("PublicAddProgramPage.State")}</label>
                  <input readOnly className={disabledCls} value={stateName} />
                </div>
                <div>
                  <label className={labelCls}>{t("PublicAddProgramPage.District")}</label>
                  <input readOnly className={disabledCls} value={districtName} />
                </div>
                <div>
                  <label className={labelCls}>{t("PublicAddProgramPage.Assembly")}</label>
                  <input readOnly className={disabledCls} value={assemblyName} />
                </div>
              </div>
              {candidateName && (
                <div>
                  <label className={labelCls}>{t("PublicAddProgramPage.Candidate")}</label>
                  <input readOnly className={disabledCls} value={candidateName} />
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>{t("PublicAddProgramPage.Program_Name")}</label>
              <input required maxLength={50} className={inputCls} value={programName}
                onChange={e => setProgramName(e.target.value)} placeholder={t("PublicAddProgramPage.Program_Name_Placeholder")} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("PublicAddProgramPage.Location")}</label>
                <input required maxLength={50} className={inputCls} value={location}
                  onChange={e => setLocation(e.target.value)} placeholder={t("PublicAddProgramPage.Location_Placeholder")} />
              </div>
              <div>
                <label className={labelCls}>{t("PublicAddProgramPage.Status")}</label>
                <select className={inputCls} value={status} onChange={e => setStatus(e.target.value as ProgramStatus)}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t("PublicAddProgramPage.Date")}</label>
                <input required type="date" min={new Date().toISOString().split('T')[0]} className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{t("PublicAddProgramPage.Time")}</label>
                <input required type="time" className={inputCls} value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>{t("PublicAddProgramPage.Description")}</label>
              <textarea required className={inputCls} rows={3} maxLength={1000}
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder={t("PublicAddProgramPage.Description_Placeholder")} />
              <p className="text-xs text-gray-400 text-right mt-0.5">{description.length}/1000</p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t("PublicAddProgramPage.Your_Details")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t("PublicAddProgramPage.Your_Name")}</label>
                  <input required className={inputCls} value={creatorName}
                    onChange={e => setCreatorName(e.target.value)} placeholder={t("PublicAddProgramPage.Your_Name_Placeholder")} />
                </div>
                <div>
                  <label className={labelCls}>{t("PublicAddProgramPage.Phone_Number")}</label>
                  <input required type="tel" pattern="[0-9]{10,15}" className={inputCls} value={creatorPhone}
                    onChange={e => setCreatorPhone(e.target.value)} placeholder={t("PublicAddProgramPage.Phone_Placeholder")} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition mt-2">
              {saving ? t("PublicAddProgramPage.Submitting") : t("PublicAddProgramPage.Submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
