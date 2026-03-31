import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { usersAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const Profile = () => {
    const { logoutUser } = useContext(AuthContext);
    const [userData, setUserData] = useState({ name: '', email: '', role: '' });
    const [passwords, setPasswords] = useState({ newPassword: '' });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await usersAPI.getMe();
                const user = res.data || res;
                setUserData({ name: user.name || '', email: user.email || '', role: user.role || '' });
            } catch (err) {
                setError('Failed to fetch profile. Please log in again.');
                if (err.message.includes('token')) logoutUser();
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [logoutUser]);

    const handleTextChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handlePassChange = (e) => {
        setPasswords({ [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload = { name: userData.name, email: userData.email };
            if (passwords.newPassword && passwords.newPassword.length >= 6) {
                payload.password = passwords.newPassword;
            }

            await usersAPI.updateMe(payload);
            setSuccess('Profile updated successfully!');
            setPasswords({ newPassword: '' });
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="premium-dark-section d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 76px)' }}><Spinner animation="grow" variant="primary" /></div>;

    return (
        <div className="premium-dark-section bg-mesh py-5 hero-min-height">
            <Container className="position-relative z-1">
                <div className="glow-effect" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(0,0,0,0) 70%)', top: '10%' }}></div>
                <Row className="justify-content-center">
                    <Col lg={8} xl={7}>
                        <div className="text-center mb-5">
                            <i className="bi bi-person-badge display-4 text-info mb-3 d-inline-block"></i>
                            <h2 className="display-5 fw-bold text-white mb-2">My <span className="gradient-text">Profile</span></h2>
                            <p className="text-light opacity-50">Manage your account credentials and system identity.</p>
                        </div>

                        <div className="glass-card p-4 p-md-5">
                            <div className="mb-4 d-flex align-items-center justify-content-center bg-dark bg-opacity-25 rounded p-3 border border-secondary border-opacity-25">
                                <span className="me-3 fw-bold text-light opacity-75">Platform Role:</span>
                                <Badge bg={userData.role === 'admin' ? 'danger' : userData.role === 'instructor' ? 'primary' : 'success'} className="px-4 py-2 text-uppercase tracking-wider" pill style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>
                                    {userData.role}
                                </Badge>
                            </div>

                            {error && <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>}
                            {success && <Alert variant="success" className="border-0 shadow-sm">{success}</Alert>}

                            <Form onSubmit={handleUpdate}>
                                <Row className="g-3 mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-light opacity-75 fw-bold">Full Name</Form.Label>
                                            <Form.Control type="text" name="name" value={userData.name} onChange={handleTextChange} className="bg-dark text-light border-secondary py-2 placeholder-white" required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-light opacity-75 fw-bold">Email Address</Form.Label>
                                            <Form.Control type="email" name="email" value={userData.email} onChange={handleTextChange} className="bg-dark text-light border-secondary py-2 placeholder-white" required />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <hr className="my-5 border-secondary border-opacity-50" />
                                <h5 className="mb-3 text-light opacity-75 fw-bold">Security Modification</h5>

                                <Form.Group className="mb-4">
                                    <Form.Label className="text-light opacity-75">New Password (Optional)</Form.Label>
                                    <Form.Control type="password" name="newPassword" value={passwords.newPassword} onChange={handlePassChange} placeholder="Leave blank to keep current cryptographic key" minLength={6} className="bg-dark text-light border-secondary py-3 placeholder-white" />
                                </Form.Group>

                                <Button type="submit" className="btn-premium w-100 fs-5 py-3 mt-2" disabled={saving}>
                                    {saving ? 'Syncing...' : 'Update Identity'} <i className="bi bi-fingerprint ms-2"></i>
                                </Button>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
            <style>{`.placeholder-white::placeholder { color: rgba(255,255,255,0.3) !important; } .tracking-wider { letter-spacing: 0.1em; }`}</style>
        </div>
    );
};
