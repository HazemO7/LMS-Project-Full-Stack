import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';

const PASSWORD_RULES = {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
    validate: {
        hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
        hasLower: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
        hasNumber: (v) => /\d/.test(v) || 'Must contain at least one number',
        hasSpecial: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Must contain at least one special character'
    }
};

const PasswordStrengthBar = ({ password }) => {
    if (!password) return null;

    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];
    const score = checks.filter(Boolean).length;

    const getColor = () => {
        if (score <= 2) return '#ef4444';
        if (score <= 3) return '#f97316';
        if (score === 4) return '#eab308';
        return '#22c55e';
    };

    const getLabel = () => {
        if (score <= 2) return 'Weak';
        if (score <= 3) return 'Fair';
        if (score === 4) return 'Good';
        return 'Strong';
    };

    return (
        <div className="mt-2">
            <div className="d-flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            backgroundColor: i <= score ? getColor() : 'rgba(255,255,255,0.1)',
                            transition: 'background-color 0.3s ease'
                        }}
                    />
                ))}
            </div>
            <small style={{ color: getColor(), fontWeight: 600 }}>{getLabel()}</small>
        </div>
    );
};

export const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useForm();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const watchedPassword = watch('password', '');

    const onSubmit = async (data) => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await authAPI.resetPassword(token, data.password);
            setSuccess(res.message || 'Password reset successfully.');
            // Clear password fields immediately for security
            reset();
            // Redirect to login after 2 seconds
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            if (err.message && err.message.toLowerCase().includes('fetch')) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError(err.message || 'Password reset failed. The link may be invalid or expired.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="premium-dark-section bg-mesh hero-min-height d-flex align-items-center justify-content-center py-5">
            <Container>
                <div className="glow-effect"></div>
                <Row className="justify-content-center position-relative z-1 w-100 mx-0">
                    <Col md={8} lg={6} xl={5}>
                        <div className="text-center mb-4">
                            <i className="bi bi-key-fill display-4 text-primary mb-3 d-inline-block"></i>
                            <h2 className="fw-bold text-white">Set New Password</h2>
                            <p className="text-light opacity-75">
                                Create a strong new password for your account.
                            </p>
                        </div>
                        <div className="glass-card p-4 p-md-5">
                            {success && (
                                <Alert variant="success" className="mb-4 border-0 shadow-sm d-flex align-items-start gap-2">
                                    <i className="bi bi-check-circle-fill flex-shrink-0 mt-1"></i>
                                    <div>
                                        <span>{success}</span>
                                        <br />
                                        <small className="opacity-75">Redirecting you to login in 2 seconds...</small>
                                    </div>
                                </Alert>
                            )}
                            {error && (
                                <Alert variant="danger" className="mb-4 border-0 shadow-sm d-flex align-items-start gap-2">
                                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1"></i>
                                    <div>
                                        <span>{error}</span>
                                        {error.toLowerCase().includes('invalid') || error.toLowerCase().includes('expired') ? (
                                            <div className="mt-2">
                                                <Link to="/forgot-password" className="alert-link text-danger fw-bold">
                                                    Request a new reset link →
                                                </Link>
                                            </div>
                                        ) : null}
                                    </div>
                                </Alert>
                            )}

                            {!success && (
                                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                                    {/* New Password */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-light opacity-75 fw-bold">
                                            New Password
                                        </Form.Label>
                                        <div className="position-relative">
                                            <Form.Control
                                                {...register('password', PASSWORD_RULES)}
                                                type={showPassword ? 'text' : 'password'}
                                                id="reset-password"
                                                className={`bg-dark text-light border-secondary py-3 pe-5 placeholder-faded ${errors.password ? 'is-invalid' : ''}`}
                                                placeholder="Enter new password"
                                                autoComplete="new-password"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                id="toggle-password-visibility"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent text-light opacity-60 p-0"
                                                style={{ zIndex: 5 }}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <div className="text-danger small mt-1">
                                                {errors.password.message}
                                            </div>
                                        )}
                                        <PasswordStrengthBar password={watchedPassword} />
                                    </Form.Group>

                                    {/* Confirm Password */}
                                    <Form.Group className="mb-5">
                                        <Form.Label className="text-light opacity-75 fw-bold">
                                            Confirm New Password
                                        </Form.Label>
                                        <div className="position-relative">
                                            <Form.Control
                                                {...register('confirmPassword', {
                                                    required: 'Please confirm your new password',
                                                    validate: (v) =>
                                                        v === watchedPassword || 'Passwords do not match'
                                                })}
                                                type={showConfirm ? 'text' : 'password'}
                                                id="reset-confirm-password"
                                                className={`bg-dark text-light border-secondary py-3 pe-5 placeholder-faded ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                                placeholder="Re-enter new password"
                                                autoComplete="new-password"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                id="toggle-confirm-visibility"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                className="position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent text-light opacity-60 p-0"
                                                style={{ zIndex: 5 }}
                                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                            >
                                                <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <div className="invalid-feedback d-block mt-1">
                                                {errors.confirmPassword.message}
                                            </div>
                                        )}
                                    </Form.Group>

                                    {/* Password Policy Hint */}
                                    <div className="mb-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <small className="text-light opacity-60 d-block mb-2 fw-bold">Password must include:</small>
                                        {[
                                            { check: watchedPassword.length >= 8, label: 'At least 8 characters' },
                                            { check: /[A-Z]/.test(watchedPassword), label: 'One uppercase letter' },
                                            { check: /[a-z]/.test(watchedPassword), label: 'One lowercase letter' },
                                            { check: /\d/.test(watchedPassword), label: 'One number' },
                                            { check: /[!@#$%^&*(),.?":{}|<>]/.test(watchedPassword), label: 'One special character' }
                                        ].map(({ check, label }) => (
                                            <div key={label} className="d-flex align-items-center gap-2 mb-1">
                                                <i className={`bi ${check ? 'bi-check-circle-fill text-success' : 'bi-circle text-secondary'} small`}></i>
                                                <small className={check ? 'text-success' : 'text-light opacity-50'}>{label}</small>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        type="submit"
                                        id="reset-submit-btn"
                                        className="btn-premium w-100 fs-5 mb-4 py-3"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Resetting Password...
                                            </>
                                        ) : (
                                            <>Reset Password <i className="bi bi-shield-check ms-2"></i></>
                                        )}
                                    </Button>

                                    <div className="text-center">
                                        <Link to="/login" className="text-info text-decoration-none small">
                                            <i className="bi bi-arrow-left me-1"></i>Back to Login
                                        </Link>
                                    </div>
                                </Form>
                            )}

                            {success && (
                                <div className="text-center mt-3">
                                    <Link to="/login" className="btn btn-outline-light px-4 py-2">
                                        <i className="bi bi-arrow-left me-2"></i>Go to Login
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>
            <style>{`.placeholder-faded::placeholder { color: rgba(255,255,255,0.3) !important; }`}</style>
        </div>
    );
};
