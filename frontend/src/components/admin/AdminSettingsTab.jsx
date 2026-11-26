import React from 'react';
import { AlertBanner } from '../ui/AlertBanner';

const SettingsNumberField = ({ id, label, min, max, value, onChange }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[#0D2E2F]">
      {label}
    </label>
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-[#99F6E4] px-3 py-2 text-sm text-[#0D2E2F]"
    />
  </div>
);

const SettingsLoadError = ({ errorMessage, onRetry, t, tServer }) => (
  <div className="mt-6">
    <AlertBanner variant="error">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{tServer(errorMessage || 'Failed to load platform settings')}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-[#991B1B] ring-1 ring-[#FECACA] hover:bg-[#FEF2F2]"
        >
          {t('common.retry')}
        </button>
      </div>
    </AlertBanner>
  </div>
);

const SettingsForm = ({ form, saving, onFieldChange, onSubmit, t }) => (
  <form onSubmit={onSubmit} className="mt-6">
    <fieldset disabled={saving} className="space-y-5 disabled:opacity-75">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#CCFBF1] bg-[#F0FDFA]/60 p-4">
        <input
          type="checkbox"
          checked={form.allowPublicRegistration}
          onChange={(e) => onFieldChange('allowPublicRegistration', e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[#5EEAD4] text-[#0D9488]"
        />
        <div>
          <span className="block text-sm font-semibold text-[#0D2E2F]">{t('admin.allowPublicRegLabel')}</span>
          <span className="mt-0.5 block text-xs text-[#335C5D]">{t('admin.allowPublicRegHint')}</span>
        </div>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <SettingsNumberField
          id="setting-video-mb"
          label={t('admin.maxVideoSizeLabel')}
          min={10}
          max={2048}
          value={form.maxVideoSizeMB}
          onChange={(v) => onFieldChange('maxVideoSizeMB', v)}
        />
        <SettingsNumberField
          id="setting-doc-mb"
          label={t('admin.maxDocSizeLabel')}
          min={1}
          max={250}
          value={form.maxDocumentSizeMB}
          onChange={(v) => onFieldChange('maxDocumentSizeMB', v)}
        />
        <SettingsNumberField
          id="setting-img-mb"
          label={t('admin.maxImgSizeLabel')}
          min={1}
          max={50}
          value={form.maxImageSizeMB}
          onChange={(v) => onFieldChange('maxImageSizeMB', v)}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
      >
        {saving ? t('common.saving') : t('admin.saveSettingsBtn')}
      </button>
    </fieldset>
  </form>
);

export const AdminSettingsTab = ({
  form, loaded, loading, saving, loadError, onRetry, onFieldChange, onSubmit, t, tServer,
}) => (
  <div className="max-w-2xl rounded-2xl border border-[#99F6E4] bg-white p-6 shadow-xs">
    <h2 className="font-display text-lg font-semibold text-[#0D2E2F]">{t('admin.settingsTitle')}</h2>
    <p className="mt-1 text-xs text-[#335C5D]">{t('admin.settingsDesc')}</p>
    {loading ? (
      <p className="mt-6 text-sm text-[#52797A]">{t('common.loading')}</p>
    ) : !loaded ? (
      <SettingsLoadError errorMessage={loadError} onRetry={onRetry} t={t} tServer={tServer} />
    ) : (
      <SettingsForm form={form} saving={saving} onFieldChange={onFieldChange} onSubmit={onSubmit} t={t} />
    )}
  </div>
);
