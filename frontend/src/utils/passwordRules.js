export const getPasswordRules = (t) => ({
  required: t('auth.passwordRequired'),
  minLength: { value: 8, message: t('auth.passwordMin8') },
  validate: {
    hasUpper: (v) => /[A-Z]/.test(v) || t('auth.passwordUpper'),
    hasLower: (v) => /[a-z]/.test(v) || t('auth.passwordLower'),
    hasNumber: (v) => /\d/.test(v) || t('auth.passwordNumber'),
    hasSpecial: (v) =>
      /[!@#$%^&*(),.?":{}|<>]/.test(v) || t('auth.passwordSpecial'),
  },
});

export const getPasswordChecks = (password = '', t) => [
  { key: 'length', check: password.length >= 8, label: t('pw.reqLength') },
  { key: 'upper', check: /[A-Z]/.test(password), label: t('pw.reqUpper') },
  { key: 'lower', check: /[a-z]/.test(password), label: t('pw.reqLower') },
  { key: 'number', check: /\d/.test(password), label: t('pw.reqNumber') },
  {
    key: 'special',
    check: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    label: t('pw.reqSpecial'),
  },
];
