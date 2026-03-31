import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

export const About = () => {
    return (
        <div className="premium-dark-section" style={{ padding: '100px 0', minHeight: 'calc(100vh - 56px)' }}>
            <Container>
                <Row className="align-items-center gy-5">
                    <Col lg={6} className="order-lg-2">
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                            alt="Our Team"
                            className="img-fluid rounded-4 shadow-lg w-100 border border-secondary border-opacity-25"
                            style={{ objectFit: 'cover', minHeight: '400px' }}
                        />
                    </Col>
                    <Col lg={6} className="order-lg-1 pe-lg-5">
                        <h2 className="display-4 fw-bold mb-4">Empowering the <span className="gradient-text">Next Generation</span></h2>
                        <p className="lead text-light opacity-75 mb-4" style={{ fontSize: '1.2rem' }}>
                            We believe education should be breathtaking, accessible, and securely tracked. By combining state-of-the-art Web3-esque aesthetics with razor-sharp backend role-based access controls, we are building the definitive Learning Management System.
                        </p>
                        <p className="text-light opacity-50 mb-5 fs-5">
                            Our platform is crafted for visionary instructors and ambitious students. With tools spanning instant curriculum deployment, deep video embedding, and real-time authenticated progress markers, your journey to mastery begins instantly.
                        </p>
                        <div className="d-flex gap-4 flex-wrap">
                            <div className="glass-card px-4 py-3 text-center border-0 bg-transparent shadow-none">
                                <h3 className="fw-bold text-white mb-0 display-6">2.0</h3>
                                <small className="text-primary fw-bold text-uppercase tracking-wider">Current Build</small>
                            </div>
                            <div className="glass-card px-4 py-3 text-center border-0 bg-transparent shadow-none">
                                <h3 className="fw-bold text-white mb-0 display-6">AES</h3>
                                <small className="text-danger fw-bold text-uppercase tracking-wider">Encryption</small>
                            </div>
                            <div className="glass-card px-4 py-3 text-center border-0 bg-transparent shadow-none">
                                <h3 className="fw-bold text-white mb-0 display-6">100%</h3>
                                <small className="text-success fw-bold text-uppercase tracking-wider">Uptime</small>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};
