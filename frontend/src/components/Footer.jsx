import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="py-5" style={{ backgroundColor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Container>
                <Row className="gy-4">
                    <Col lg={4} md={6}>
                        <h4 className="fw-bold text-white mb-3 d-flex align-items-center">
                            <i className="bi bi-mortarboard-fill text-primary me-2 fs-3"></i>
                            <span>LMS<span className="text-primary">Premium</span></span>
                        </h4>
                        <p className="text-light opacity-50 pe-md-4" style={{ fontSize: '1rem' }}>
                            The definitive Learning Management ecosystem. Engineered with Node.js, React, and absolute administrative security boundaries.
                        </p>
                    </Col>
                    <Col lg={2} md={3} xs={6}>
                        <h5 className="text-white mb-3">Platform</h5>
                        <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                            <li><Link to="/" className="text-light opacity-75 text-decoration-none nav-hover transition-colors">Home</Link></li>
                            <li><Link to="/courses" className="text-light opacity-75 text-decoration-none nav-hover transition-colors">Curriculum</Link></li>
                            <li><Link to="/profile" className="text-light opacity-75 text-decoration-none nav-hover transition-colors">Dashboard</Link></li>
                        </ul>
                    </Col>
                    <Col lg={2} md={3} xs={6}>
                        <h5 className="text-white mb-3">Company</h5>
                        <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                            <li><Link to="/about" className="text-light opacity-75 text-decoration-none nav-hover transition-colors">Our Story</Link></li>
                            <li><Link to="/contact" className="text-light opacity-75 text-decoration-none nav-hover transition-colors">Contact Hub</Link></li>
                            <li><a href="#" className="text-light opacity-75 text-decoration-none nav-hover transition-colors">API Docs</a></li>
                        </ul>
                    </Col>
                    <Col lg={4} md={12}>
                        <h5 className="text-white mb-3">Join the Terminal</h5>
                        <p className="text-light opacity-50 mb-3">Subscribe to system architecture updates mapping the future of EdTech.</p>
                        <div className="d-flex gap-2">
                            <input type="email" className="form-control bg-dark text-light border-secondary" placeholder="Transmission email..." style={{ borderRadius: '8px' }} />
                            <button className="btn btn-primary fw-bold px-4" style={{ borderRadius: '8px' }}>Subscribe</button>
                        </div>
                    </Col>
                </Row>
                <div className="mt-5 pt-4 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <p className="text-light opacity-50 mb-0">© {new Date().getFullYear()} LMS Premium Project. All systems secure.</p>
                    <div className="d-flex gap-4">
                        <a href="#" className="text-light opacity-50 nav-hover transition-colors"><i className="bi bi-github fs-5"></i></a>
                        <a href="#" className="text-light opacity-50 nav-hover transition-colors"><i className="bi bi-twitter-x fs-5"></i></a>
                        <a href="#" className="text-light opacity-50 nav-hover transition-colors"><i className="bi bi-discord fs-5"></i></a>
                    </div>
                </div>
            </Container>
            <style>{`.nav-hover:hover { opacity: 1 !important; color: #60a5fa !important; } .transition-colors { transition: color 0.2s ease, opacity 0.2s ease; }`}</style>
        </footer>
    );
};
