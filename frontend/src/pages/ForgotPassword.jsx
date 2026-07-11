import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';

export const ForgotPassword = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async (data) => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await authAPI.forgotPassword(data.email);
            // Always show the generic message from the backend (anti-enumeration)
            setSuccess(res.message || 'If an account exists, a password reset email has been sent.');
        } catch (err) {
            if (err.message && err.message.toLowerCase().includes('fetch')) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError(err.message || 'Something went wrong. Please try again.');
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
                            <i className="bi bi-shield-lock display-4 text-primary mb-3 d-inline-block"></i>
                            <h2 className="fw-bold text-white">Forgot Password?</h2>
                            <p className="text-light opacity-75">
                                Enter your email and we'll send you a reset link if an account exists.
                            </p>
                        </div>
                        <div className="glass-card p-4 p-md-5">
                            {success && (
                                <Alert variant="success" className="mb-4 border-0 shadow-sm d-flex align-items-start gap-2">
                                    <i className="bi bi-check-circle-fill flex-shrink-0 mt-1"></i>
                                    <span>{success}</span>
                                </Alert>
                            )}
                            {error && (
                                <Alert variant="danger" className="mb-4 border-0 shadow-sm d-flex align-items-start gap-2">
                                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1"></i>
                                    <span>{error}</span>
                                </Alert>
                            )}

                            {!success ? (
                                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-light opacity-75 fw-bold">
                                            Email Address
                                        </Form.Label>
                                        <Form.Control
                                            {...register('email', {
                                                required: 'Email address is required',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Please enter a valid email address'
                                                }
                                            })}
                                            type="email"
                                            id="forgot-email"
                                            className={`bg-dark text-light border-secondary py-3 placeholder-faded ${errors.email ? 'is-invalid' : ''}`}
                                            placeholder="Enter your registered email"
                                            autoComplete="email"
                                            disabled={loading}
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback d-block mt-1">
                                                {errors.email.message}
                                            </div>
                                        )}
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        id="forgot-submit-btn"
                                        className="btn-premium w-100 fs-5 mb-4 py-3"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Sending Reset Link...
                                            </>
                                        ) : (
                                            <>Send Reset Link <i className="bi bi-envelope-arrow-up-fill ms-2"></i></>
                                        )}
                                    </Button>

                                    <div className="text-center">
                                        <span className="text-light opacity-50">Remember your password? </span>
                                        <Link to="/login" className="text-info text-decoration-none fw-bold ms-1">
                                            Back to Login
                                        </Link>
                                    </div>
                                </Form>
                            ) : (
                                <div className="text-center py-3">
                                    <i className="bi bi-envelope-check-fill display-1 text-success mb-3 d-block"></i>
                                    <p className="text-light opacity-75 mb-4">
                                        Check your inbox and click the link in the email. The link expires in <strong className="text-warning">15 minutes</strong>.
                                    </p>
                                    <p className="text-light opacity-50 small mb-4">
                                        Didn't receive an email? Check your spam folder, or try again with a different email address.
                                    </p>
                                    <Link to="/login" className="btn btn-outline-light px-4 py-2">
                                        <i className="bi bi-arrow-left me-2"></i>Back to Login
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
