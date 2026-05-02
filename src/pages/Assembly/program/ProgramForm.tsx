import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ProgramListItem, ProgramStatus } from "./types";
import { useAppSelector } from "../../../store/hooks";

export interface ProgramSubmitData {
  program_name: string;
  isActive: number;
  manager: {
    party_id?: number;
    state_id: number;
    district_id: number;
    assembly_id: number;
    candidate_id: number;
    location: string;
    date: string;
    time: string;
    description: string;
    status: ProgramStatus;
    created_by?: string;
    creator_phone_no?: string;
    creator_id: number;
    isActive: number;
  };
}

interface ProgramFormProps {
  initial?: ProgramListItem | null;
  onSubmit: (data: ProgramSubmitData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS: ProgramStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETE', 'MISSED'];

export default function ProgramForm({ initial, onSubmit, onCancel, loading }: ProgramFormProps) {
  const { t } = useTranslation();
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);

  const assemblyId = selectedAssignment?.stateMasterData_id || 0;
  const stateId = (user as any)?.state_id || 0;
  const districtId = (user as any)?.district_id || 0;
  const partyId = (user as any)?.partyId || 0;
  const userId = user?.id || 0;

  const [programName, setProgramName] = useState('');
  const [isActive, setIsActive] = useState(1);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProgramStatus>('PENDING');
  const [creatorName, setCreatorName] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('');

  useEffect(() => {
    if (initial) {
      setProgramName(initial.program_name || '');
      setIsActive(initial.isActive ?? 1);
      setLocation(initial.location || '');
      setDate(initial.date?.slice(0, 10) || '');
      setTime(initial.time?.slice(0, 5) || '');
      setDescription(initial.description || '');
      setStatus(initial.status || 'PENDING');
      if (initial.creator_phone_no) setCreatorPhone(initial.creator_phone_no);
      const isNameString = initial.created_by && isNaN(Number(initial.created_by));
      if (isNameString) setCreatorName(initial.created_by!);
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      program_name: programName,
      isActive,
      manager: {
        party_id: partyId,
        state_id: stateId,
        district_id: districtId,
        assembly_id: assemblyId,
        candidate_id: userId,
        location,
        date,
        time,
        description,
        status,
        created_by: userId ? undefined : (creatorName || undefined),
        creator_phone_no: (!userId || creatorPhone) ? (creatorPhone || undefined) : undefined,
        creator_id: userId,
        isActive,
      },
    });
  };

  const inputCls = "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition";
  const labelCls = "block text-xs font-medium text-[var(--text-secondary)] mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>{t("ProgramForm.Program_Name")}</label>
        <input required maxLength={50} className={inputCls} value={programName}
          onChange={e => setProgramName(e.target.value)} placeholder={t("ProgramForm.Program_Name_Placeholder")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("ProgramForm.Candidate")}</label>
          <input
            readOnly
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/50 px-3 py-2 text-sm text-[var(--text-secondary)] cursor-not-allowed"
            value={`${user?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || user?.username || 'You'}
          />
        </div>
        <div>
          <label className={labelCls}>{t("ProgramForm.Location")}</label>
          <input required maxLength={50} className={inputCls} value={location}
            onChange={e => setLocation(e.target.value)} placeholder={t("ProgramForm.Location_Placeholder")} />
        </div>
        <div>
          <label className={labelCls}>{t("ProgramForm.Status")}</label>
          <select disabled={!!initial} className={`${inputCls} ${initial ? 'bg-[var(--bg-main)]/50 text-[var(--text-secondary)] cursor-not-allowed' : ''}`} value={status} onChange={e => setStatus(e.target.value as ProgramStatus)}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("ProgramForm.Date")}</label>
          <input required type="date" min={new Date().toISOString().split('T')[0]} className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>{t("ProgramForm.Time")}</label>
          <input required type="time" className={inputCls} value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="isActive" checked={isActive === 1}
            onChange={e => setIsActive(e.target.checked ? 1 : 0)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
          <label htmlFor="isActive" className="text-sm text-[var(--text-color)]">{t("ProgramForm.Is_Active")}</label>
        </div>
      </div>

      <div>
        <label className={labelCls}>{t("ProgramForm.Description")}</label>
        <textarea required className={inputCls} rows={3} maxLength={1000}
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder={t("ProgramForm.Description_Placeholder")} />
        <p className="text-xs text-[var(--text-secondary)] text-right mt-0.5">{description.length}/1000</p>
      </div>

      {(!userId || (initial && initial.creator_phone_no)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{!userId ? t("ProgramForm.Creator_Name_Required") : t("ProgramForm.Creator_Name")}</label>
            <input
              required={!userId}
              className={inputCls}
              value={creatorName}
              onChange={e => setCreatorName(e.target.value)}
              placeholder={t("ProgramForm.Creator_Name_Placeholder")}
            />
          </div>
          <div>
            <label className={labelCls}>{!userId ? t("ProgramForm.Phone_Number_Required") : t("ProgramForm.Phone_Number")}</label>
            <input
              required={!userId}
              type="tel"
              pattern="[0-9]{10,15}"
              className={inputCls}
              value={creatorPhone}
              onChange={e => setCreatorPhone(e.target.value)}
              placeholder={t("ProgramForm.Phone_Placeholder")}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 transition">
          {t("ProgramForm.Cancel")}
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition">
          {loading ? t("ProgramForm.Saving") : initial ? t("ProgramForm.Update_Program") : t("ProgramForm.Add_Program")}
        </button>
      </div>
    </form>
  );
}
