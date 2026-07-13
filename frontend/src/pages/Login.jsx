import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

export const Login = () => {
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [remainingAttempts, setRemainingAttempts] = useState(null);
    const [lockedUntil, setLockedUntil] = useState(null);
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (!lockedUntil) {
            setCountdown('');
            return;
        }

        const calculateTimeLeft = () => {
            const difference = new Date(lockedUntil).getTime() - new Date().getTime();
            if (difference <= 0) {
                setLockedUntil(null);
                setCountdown('');
                setError('');
                return null;
            }
            
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        let timeString = calculateTimeLeft();
        if (!timeString) return;
        setCountdown(timeString);

        const interval = setInterval(() => {
            timeString = calculateTimeLeft();
            if (timeString) setCountdown(timeString);
        }, 1000);

        return () => clearInterval(interval);
    }, [lockedUntil]);

    useEffect(() => {
        if (error && !lockedUntil) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error, lockedUntil]);

    const onSubmit = async (data) => {
        setError('');
        setRemainingAttempts(null);
        setLoading(true);
        try {
            const res = await authAPI.login(data);
            loginUser(res.token);
            navigate('/courses');
        } catch (err) {
            setError(err.message || 'Login failed');
            if (err.status === 401 && err.remainingAttempts !== undefined) {
                setRemainingAttempts(err.remainingAttempts);
            }
            if (err.status === 423 && err.lockedUntil) {
                setLockedUntil(err.lockedUntil);
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
                            <i className="bi bi-person-bounding-box display-4 text-primary mb-3 d-inline-block"></i>
                            <h2 className="fw-bold text-white">Welcome Back</h2>
                            <p className="text-light opacity-75">Sign in to access your secure learning environment.</p>
                        </div>
                        <div className="glass-card p-4 p-md-5">
                            {error && !lockedUntil && remainingAttempts === null && (
                                <Alert variant="danger" className="mb-4 shadow-sm border-0">{error}</Alert>
                            )}
                            {error && !lockedUntil && remainingAttempts !== null && (
                                <Alert variant="danger" className="mb-4 shadow-sm border-0">
                                    {error}. {remainingAttempts} attempts remaining.
                                </Alert>
                            )}
                            {lockedUntil && (
                                <Alert variant="danger" className="mb-4 shadow-sm border-0">
                                    Your account has been locked due to multiple failed login attempts.<br/>
                                    Try again in {countdown}.
                                </Alert>
                            )}
                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="text-light opacity-75 fw-bold">Email Address</Form.Label>
                                    <Form.Control
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Invalid email address"
                                            }
                                        })}
                                        type="email"
                                        className={`bg-dark text-light border-secondary py-3 placeholder-white ${errors.email ? 'is-invalid' : ''}`}
                                        placeholder="Enter your registered email"
                                    />
                                    {errors.email && (
                                        <div className="invalid-feedback text-danger mt-1">
                                            {errors.email.message}
                                        </div>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-5">
                                    <div className="d-flex justify-content-between">
                                        <Form.Label className="text-light opacity-75 fw-bold">Secure Password</Form.Label>
                                        <Link to="/forgot-password" className="text-primary text-decoration-none small">Forgot password?</Link>
                                    </div>
                                    <Form.Control
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                                        })}
                                        type="password"
                                        className={`bg-dark text-light border-secondary py-3 placeholder-white ${errors.password ? 'is-invalid' : ''}`}
                                        placeholder="Enter your password"
                                    />
                                    {errors.password && (
                                        <div className="invalid-feedback text-danger mt-1">
                                            {errors.password.message}
                                        </div>
                                    )}
                                </Form.Group>
                                <Button type="submit" className="btn-premium w-100 fs-5 mb-4 py-3" disabled={loading}>
                                    {loading ? 'Authenticating...' : 'Secure Login'} <i className="bi bi-arrow-right-circle-fill ms-2"></i>
                                </Button>
                                <div className="text-center">
                                    <span className="text-light opacity-50">Don't have an account? </span>
                                    <Link to="/register" className="text-info text-decoration-none fw-bold ms-1">Create one now</Link>
                                </div>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
            <style>{`.placeholder-white::placeholder { color: rgba(255,255,255,0.3) !important; }`}</style>
        </div>
    );
};
