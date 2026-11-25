export const PASSWORD_RULES = {
  required: 'Password is required',
  minLength: { value: 8, message: 'Password must be at least 8 characters' },
  validate: {
    hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
    hasLower: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
    hasNumber: (v) => /\d/.test(v) || 'Must contain at least one number',
    hasSpecial: (v) =>
      /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Must contain at least one special character',
  },
};

export const getPasswordChecks = (password = '') => [
  { key: 'length', check: password.length >= 8, label: 'At least 8 characters' },
  { key: 'upper', check: /[A-Z]/.test(password), label: 'One uppercase letter' },
  { key: 'lower', check: /[a-z]/.test(password), label: 'One lowercase letter' },
  { key: 'number', check: /\d/.test(password), label: 'One number' },
  {
    key: 'special',
    check: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    label: 'One special character (!@#$%^&*...)',
  },
];
