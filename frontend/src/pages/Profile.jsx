import React from 'react';
import { ShieldCheck, UserCircle } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getRoleBadgeClass } from '../utils/roleUtils';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ProfileIdentitySection } from '../components/profile/ProfileIdentitySection';
import { ProfilePasswordSection } from '../components/profile/ProfilePasswordSection';

const ForcePasswordBanner = ({ show, t }) => {
  if (!show) return null;
  return (
    <AlertBanner variant="warning" className="mb-6">
      <strong className="block font-semibold">{t('profile.forcePwBannerTitle')}</strong>
      <span className="mt-0.5 block text-xs">{t('profile.forcePwBannerBody')}</span>
    </AlertBanner>
  );
};

export const Profile = () => {
  const { currentUser, userLoading, refreshUser, logoutUser } = useAuth();
  const { t } = useLanguage();

  if (userLoading && !currentUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-[#99F6E4] border-t-[#0D9488]"
          role="status"
          aria-label={t('common.loading')}
        />
      </div>
    );
  }

  const mustRotatePw = Boolean(currentUser?.mustChangePassword);
  const roleBadgeClass = getRoleBadgeClass(currentUser?.role);

  return (
    <div>
      <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#114B4D] text-[#2DD4BF] ring-1 ring-[#2DD4BF]/30">
              <UserCircle size={28} weight="duotone" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {t('profile.title')}
              </h1>
              <p className="text-sm text-[#CCFBF1]/85">{t('profile.subtitle')}</p>
            </div>
          </div>

          {currentUser?.role && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#1E6466] bg-[#114B4D] px-3.5 py-2">
              <ShieldCheck size={16} weight="duotone" aria-hidden="true" className="text-[#F59E0B]" />
              <span className="text-xs font-medium text-[#99F6E4]">{t('profile.roleLabel')}</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${roleBadgeClass}`}>
                {t(`role.${currentUser.role}`)}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10 lg:px-8">
        <ForcePasswordBanner show={mustRotatePw} t={t} />
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <ProfileIdentitySection
            currentUser={currentUser}
            mustRotatePw={mustRotatePw}
            refreshUser={refreshUser}
          />
          <ProfilePasswordSection logoutUser={logoutUser} mustRotatePw={mustRotatePw} />
        </div>
      </div>
    </div>
  );
};
