import React, { useContext, useState } from 'react';
import { Container, Row, Col, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const Home = () => {
    const { userToken } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showAlert, setShowAlert] = useState(false);

    const handleExploreClick = (e) => {
        e.preventDefault();
        if (userToken) {
            navigate('/courses');
        } else {
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 5000); // Hide after 5 seconds
        }
    };

    return (
        <div className="premium-dark-section bg-mesh hero-min-height">
            <Container className="py-5 position-relative">
                <Row className="align-items-center gy-5">
                    <Col lg={6} className="text-center text-lg-start z-3">
                        <Badge bg="primary" pill className="px-3 py-2 mb-3 bg-opacity-25 border border-primary text-primary" style={{ fontSize: '0.9rem' }}>
                            🚀 LMS Framework 2.0
                        </Badge>
                        <h1 className="display-3 fw-bold mb-4">
                            Master Your Future with <span className="gradient-text">Elite Learning</span>
                        </h1>
                        <p className="lead text-light opacity-75 mb-5" style={{ fontSize: '1.25rem' }}>
                            Join thousands of ambitious students. Access world-class courses, track your progress flawlessly, and connect with top-tier instructors in our premium ecosystem.
                        </p>
                        {showAlert && (
                            <Alert variant="danger" className="glass-alert border-danger border-opacity-50 text-light mb-4 fade show">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                🔒 You need to login first to explore our courses.
                            </Alert>
                        )}
                        <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                            <button onClick={handleExploreClick} className="btn-premium fs-5 px-5 border-0">Explore our Courses</button>
                            <button onClick={() => navigate('/about')} className="btn btn-outline-light fs-5 px-4" style={{ borderRadius: '8px' }}>Our Mission</button>
                        </div>
                    </Col>
                    <Col lg={6} className="text-center position-relative z-3">
                        <div className="glow-effect"></div>
                        <img
                            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                            alt="LMS Interface"
                            className="img-fluid floating rounded-4 shadow-lg border border-secondary border-opacity-25 position-relative z-1"
                        />
                    </Col>
                </Row>

                <Row className="mt-5 pt-5 text-center g-4 position-relative z-3">
                    <Col md={4}>
                        <div className="glass-card p-5 h-100">
                            <i className="bi bi-rocket-takeoff-fill display-4 text-primary mb-3 d-block"></i>
                            <h4 className="fw-bold mb-3">Fast Tracking</h4>
                            <p className="text-light opacity-75 mb-0 fs-5">Our new progressive tracking engine guarantees you hit every milestone effortlessly.</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="glass-card p-5 h-100">
                            <i className="bi bi-shield-lock-fill display-4 text-danger mb-3 d-block"></i>
                            <h4 className="fw-bold mb-3">True Ownership</h4>
                            <p className="text-light opacity-75 mb-0 fs-5">Built-in authentic RBAC ensures your courses and progress are completely untouchable.</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="glass-card p-5 h-100">
                            <i className="bi bi-gem display-4 text-info mb-3 d-block"></i>
                            <h4 className="fw-bold mb-3">Premium UI</h4>
                            <p className="text-light opacity-75 mb-0 fs-5">Fluid glassmorphism and animated interfaces create a stunning uninterrupted study environment.</p>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};
