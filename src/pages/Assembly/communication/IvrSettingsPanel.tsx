import { useEffect, useState, type ChangeEvent } from "react";

export type VoiceTypeCode = "33" | "34" | "35" | "37";
export type ObdTypeOption = "" | "single_voice" | "dtmf";
export type RetryIntervalOption = "" | "15" | "30";
export type RetryCountOption = "" | "1" | "2";

export interface IvrFormState {
  voice_type: VoiceTypeCode;
  voice_medias_id: string;
  scheduled: "0" | "1";
  timezone_id: string;
  scheduled_datetime: string;
  obd_type: ObdTypeOption;
  retry_interval: RetryIntervalOption;
  retry_count: RetryCountOption;
  otp: string;
}

export interface IvrOptionsPayload {
  voice_type: number;
  voice_medias_id: number;
  scheduled: number;
  timezone_id?: number;
  scheduled_datetime?: string;
  obd_type?: "single_voice" | "dtmf";
  retry_interval?: number;
  retry_count?: number;
  otp?: number;
}

interface VoiceMediaItem {
  id?: number | string;
  media_id?: number | string;
  announcement_id?: number | string;
  voice_medias_id?: number | string;
  voice_media_id?: number | string;
  message_id?: number | string;
  vendor_account_id?: number | string;
  title?: string;
  type?: string;
  status?: string;
  voice_note?: string;
}

export const DEFAULT_IVR_FORM_STATE: IvrFormState = {
  voice_type: "33",
  voice_medias_id: "",
  scheduled: "0",
  timezone_id: "",
  scheduled_datetime: "",
  obd_type: "",
  retry_interval: "",
  retry_count: "",
  otp: "",
};

const VOICE_TYPE_OPTIONS: Array<{ value: VoiceTypeCode; label: string }> = [
  { value: "33", label: "33 - Transactional (30 Sec)" },
  { value: "34", label: "34 - Promotional (30 Sec)" },
  { value: "35", label: "35 - TTS (Text-to-Speech)" },
  { value: "37", label: "37 - IVR (1 Sec)" },
];

export function validateIvrForm(state: IvrFormState): string | null {
  const mediaId = state.voice_medias_id.trim();
  if (!mediaId || !/^\d+$/.test(mediaId) || Number(mediaId) <= 0) {
    return "Please enter a valid numeric Voice Media ID";
  }

  if (state.scheduled === "1" && !state.scheduled_datetime.trim()) {
    return "Please select a scheduled date and time for the IVR call";
  }

  if (state.timezone_id.trim() && !/^\d+$/.test(state.timezone_id.trim())) {
    return "Timezone ID must be a positive number";
  }

  if (state.otp.trim() && !/^\d+$/.test(state.otp.trim())) {
    return "OTP must be numeric";
  }

  return null;
}

function formatScheduledDateTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  // Convert HTML datetime-local ("YYYY-MM-DDTHH:mm") to "YYYY-MM-DD HH:mm:00"
  const normalized = trimmed.replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

export function buildIvrOptionsPayload(state: IvrFormState): IvrOptionsPayload {
  const payload: IvrOptionsPayload = {
    voice_type: Number(state.voice_type),
    voice_medias_id: Number(state.voice_medias_id.trim()),
    scheduled: Number(state.scheduled),
  };

  if (state.scheduled === "1") {
    const formattedDateTime = formatScheduledDateTime(state.scheduled_datetime);
    if (formattedDateTime) {
      payload.scheduled_datetime = formattedDateTime;
    }
    if (state.timezone_id.trim()) {
      payload.timezone_id = Number(state.timezone_id.trim());
    }
  }

  if (state.obd_type) {
    payload.obd_type = state.obd_type;
  }
  if (state.retry_interval) {
    payload.retry_interval = Number(state.retry_interval);
  }
  if (state.retry_count) {
    payload.retry_count = Number(state.retry_count);
  }
  if (state.otp.trim()) {
    payload.otp = Number(state.otp.trim());
  }

  return payload;
}

function resolveMediaId(item: VoiceMediaItem): string {
  const raw =
    item.media_id ??
    item.id ??
    item.voice_medias_id ??
    item.voice_media_id ??
    item.message_id ??
    "";
  return String(raw).trim();
}

function formatAudioDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "30";
  return String(Math.max(1, Math.round(seconds)));
}

interface IvrSettingsPanelProps {
  value: IvrFormState;
  onChange: (next: IvrFormState) => void;
}

export default function IvrSettingsPanel({
  value,
  onChange,
}: IvrSettingsPanelProps) {
  const [mediaList, setMediaList] = useState<VoiceMediaItem[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<string>("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [vendorAccountId, setVendorAccountId] = useState("37");
  const [uploadDuration, setUploadDuration] = useState("30");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const updateField = <K extends keyof IvrFormState>(
    key: K,
    fieldValue: IvrFormState[K]
  ) => {
    onChange({ ...value, [key]: fieldValue });
  };

  const fetchVoiceMedia = async () => {
    try {
      setMediaLoading(true);
      setMediaError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user-communication/voice-media`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load voice media list");
      }

      setMediaList(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setMediaError(
        err instanceof Error ? err.message : "Failed to load voice media list"
      );
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    fetchVoiceMedia();
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    setUploadStatus(null);

    if (file) {
      if (!uploadTitle.trim()) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio(objectUrl);
      audio.addEventListener("loadedmetadata", () => {
        setUploadDuration(formatAudioDuration(audio.duration));
        URL.revokeObjectURL(objectUrl);
      });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
      });
    }
  };

  const handleUploadVoiceMedia = async () => {
    if (!uploadTitle.trim()) {
      setUploadStatus({ type: "error", text: "Please enter a title" });
      return;
    }
    if (!vendorAccountId.trim() || !/^\d+$/.test(vendorAccountId.trim())) {
      setUploadStatus({
        type: "error",
        text: "Please enter a numeric Vendor Account ID",
      });
      return;
    }
    if (!uploadDuration.trim()) {
      setUploadStatus({ type: "error", text: "Please enter audio duration" });
      return;
    }
    if (!uploadFile) {
      setUploadStatus({ type: "error", text: "Please select an audio file" });
      return;
    }

    try {
      setUploading(true);
      setUploadStatus(null);

      const formData = new FormData();
      formData.append("title", uploadTitle.trim());
      formData.append("vendor_account_id", vendorAccountId.trim());
      formData.append("duration", uploadDuration.trim());
      formData.append("voice_note", uploadFile);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user-communication/voice-media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
          },
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to upload voice media");
      }

      const returnedRaw =
        result.data?.id ??
        result.data?.media_id ??
        result.data?.voice_medias_id;
      const returnedId =
        returnedRaw !== undefined && returnedRaw !== null
          ? String(returnedRaw)
          : "";

      if (returnedId) {
        updateField("voice_medias_id", returnedId);
      }

      setUploadStatus({
        type: "success",
        text: returnedId
          ? `Uploaded successfully! Voice Media ID: ${returnedId} (Status: ${result.data?.status || "Pending"})`
          : result.message || "Uploaded successfully!",
      });

      setUploadTitle("");
      setUploadFile(null);
      await fetchVoiceMedia();
    } catch (err) {
      setUploadStatus({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to upload voice media",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4 p-4 rounded-lg border border-purple-200 bg-purple-50/40 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--text-color)]">
          IVR Voice Call Settings
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchVoiceMedia}
            disabled={mediaLoading}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-purple-300 bg-[var(--bg-card)] text-purple-700 hover:bg-purple-50 disabled:opacity-50"
          >
            {mediaLoading ? "Refreshing..." : "Refresh Media"}
          </button>
          <button
            type="button"
            onClick={() => setShowUpload((prev) => !prev)}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700"
          >
            {showUpload ? "Close Upload" : "+ Upload Voice Note"}
          </button>
        </div>
      </div>

      {/* Upload Voice Media Panel */}
      {showUpload && (
        <div className="p-3 rounded-lg border border-purple-300 bg-[var(--bg-card)] space-y-3">
          <div className="text-xs font-semibold text-purple-800">
            Upload New Voice Media
          </div>

          {uploadStatus && (
            <div
              className={`px-3 py-2 rounded text-xs ${
                uploadStatus.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {uploadStatus.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Title *
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Campaign Voice Note"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Vendor Account ID *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={vendorAccountId}
                onChange={(e) => setVendorAccountId(e.target.value)}
                placeholder="37"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Duration (Seconds) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={uploadDuration}
                onChange={(e) => setUploadDuration(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Audio File (.wav only) *
              </label>
              <input
                type="file"
                accept=".wav,audio/wav"
                onChange={handleFileSelect}
                className="w-full text-xs text-[var(--text-secondary)] file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUploadVoiceMedia}
              disabled={uploading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Voice Media"}
            </button>
          </div>
        </div>
      )}

      {mediaError && (
        <div className="px-3 py-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
          Could not fetch Voice Media list ({mediaError}). You can still enter Voice Media ID manually.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Saved Voice Media Dropdown */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Select Saved Voice Media
          </label>
          <select
            value={selectedMediaIndex}
            onChange={(e) => {
              const idxStr = e.target.value;
              setSelectedMediaIndex(idxStr);
              if (idxStr === "") return;
              const item = mediaList[Number(idxStr)];
              if (!item) return;
              const id = resolveMediaId(item);
              if (id) {
                updateField("voice_medias_id", id);
              }
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">
              {mediaLoading
                ? "Loading voice media..."
                : mediaList.length === 0
                  ? "No saved media found"
                  : "-- Select Voice Media --"}
            </option>
            {mediaList.map((item, idx) => {
              const id = resolveMediaId(item);
              const typeText = item.type ? ` (${item.type})` : "";
              const statusText = item.status ? ` [${item.status}]` : "";
              const idText = id ? ` - ID: ${id}` : "";
              const titleText = item.title || `Media #${idx + 1}`;
              return (
                <option key={`${titleText}-${idx}`} value={String(idx)}>
                  {titleText}
                  {typeText}
                  {idText}
                  {statusText}
                </option>
              );
            })}
          </select>
          {selectedMediaIndex !== "" &&
            mediaList[Number(selectedMediaIndex)] &&
            !resolveMediaId(mediaList[Number(selectedMediaIndex)]) && (
              <p className="mt-1 text-[11px] text-amber-700">
                BulkSMSPlans API did not include Media ID for this item — please enter its ID (e.g. 14575) in Voice Media ID.
              </p>
            )}
        </div>

        {/* Voice Media ID */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Voice Media ID *
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={value.voice_medias_id}
            onChange={(e) => updateField("voice_medias_id", e.target.value)}
            placeholder="e.g. 37"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Voice Type */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Voice Type *
          </label>
          <select
            value={value.voice_type}
            onChange={(e) =>
              updateField("voice_type", e.target.value as VoiceTypeCode)
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {VOICE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Scheduled */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Schedule Call *
          </label>
          <select
            value={value.scheduled}
            onChange={(e) =>
              updateField("scheduled", e.target.value as "0" | "1")
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="0">No (Send Immediately)</option>
            <option value="1">Yes (Schedule Later)</option>
          </select>
        </div>

        {/* OBD Type */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            OBD Type (Optional)
          </label>
          <select
            value={value.obd_type}
            onChange={(e) =>
              updateField("obd_type", e.target.value as ObdTypeOption)
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Default</option>
            <option value="single_voice">Single Voice</option>
            <option value="dtmf">DTMF</option>
          </select>
        </div>

        {/* Retry Interval */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Retry Interval (Optional)
          </label>
          <select
            value={value.retry_interval}
            onChange={(e) =>
              updateField(
                "retry_interval",
                e.target.value as RetryIntervalOption
              )
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Default</option>
            <option value="15">15 Seconds</option>
            <option value="30">30 Seconds</option>
          </select>
        </div>

        {/* Retry Count */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Retry Count (Optional)
          </label>
          <select
            value={value.retry_count}
            onChange={(e) =>
              updateField("retry_count", e.target.value as RetryCountOption)
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Default</option>
            <option value="1">1 Retry</option>
            <option value="2">2 Retries</option>
          </select>
        </div>

        {value.scheduled === "1" && (
          <>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Scheduled Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                value={value.scheduled_datetime}
                onChange={(e) =>
                  updateField("scheduled_datetime", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Timezone ID (Optional)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={value.timezone_id}
                onChange={(e) => updateField("timezone_id", e.target.value)}
                placeholder="e.g. 123"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            OTP (Optional)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={value.otp}
            onChange={(e) => updateField("otp", e.target.value)}
            placeholder="Optional OTP code"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-[var(--bg-card)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>
    </div>
  );
}
