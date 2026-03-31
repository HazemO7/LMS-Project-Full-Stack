import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

export const Register = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const onSubmit = async (data) => {
        setError('');
        setLoading(true);
        try {
            await authAPI.register(data);
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="premium-dark-section bg-mesh hero-min-height d-flex align-items-center justify-content-center py-5">
            <Container>
                <div className="glow-effect" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>
                <Row className="justify-content-center position-relative z-1 w-100 mx-0">
                    <Col md={8} lg={6} xl={5}>
                        <div className="text-center mb-4">
                            <i className="bi bi-rocket-takeoff display-4 text-info mb-3 d-inline-block"></i>
                            <h2 className="fw-bold text-white">Join LMS <span className="text-primary">Premium</span></h2>
                            <p className="text-light opacity-75">Deploy your curriculum and start mastering skills today.</p>
                        </div>
                        <div className="glass-card p-4 p-md-5">
                            {error && <Alert variant="danger" className="mb-4 shadow-sm border-0">{error}</Alert>}
                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="text-light opacity-75 fw-bold">Full Name</Form.Label>
                                    <Form.Control
                                        {...register("name", {
                                            required: "Name is required",
                                            minLength: { value: 3, message: "Name must be at least 3 characters" },
                                            maxLength: { value: 30, message: "Name cannot exceed 30 characters" },
                                            pattern: { value: /^[a-zA-Z\s]*$/, message: "Only letters and spaces are allowed" }
                                        })}
                                        type="text"
                                        className={`bg-dark text-light border-secondary py-3 placeholder-white ${errors.name ? 'is-invalid' : ''}`}
                                        placeholder="John Doe"
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback text-danger mt-1">
                                            {errors.name.message}
                                        </div>
                                    )}
                                </Form.Group>
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
                                        placeholder="jack@example.com"
                                    />
                                    {errors.email && (
                                        <div className="invalid-feedback text-danger mt-1">
                                            {errors.email.message}
                                        </div>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-5">
                                    <Form.Label className="text-light opacity-75 fw-bold">Secure Password</Form.Label>
                                    <Form.Control
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                                        })}
                                        type="password"
                                        className={`bg-dark text-light border-secondary py-3 placeholder-white ${errors.password ? 'is-invalid' : ''}`}
                                        placeholder="Min 6 characters"
                                    />
                                    {errors.password && (
                                        <div className="invalid-feedback text-danger mt-1">
                                            {errors.password.message}
                                        </div>
                                    )}
                                </Form.Group>
                                <Button type="submit" className="btn-premium w-100 fs-5 mb-4 py-3" disabled={loading}>
                                    {loading ? 'Encrypting...' : 'Initialize Account'} <i className="bi bi-shield-check ms-2"></i>
                                </Button>
                                <div className="text-center">
                                    <span className="text-light opacity-50">Already registered? </span>
                                    <Link to="/login" className="text-primary text-decoration-none fw-bold ms-1">Access Terminal</Link>
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
