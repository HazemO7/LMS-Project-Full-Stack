import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

export const Contact = () => {
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => setSent(false), 5000);
    };

    return (
        <div className="premium-dark-section" style={{ padding: '80px 0', minHeight: 'calc(100vh - 56px)' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col lg={8} className="text-center mb-5">
                        <h2 className="display-4 fw-bold mb-3">Get in <span className="gradient-text">Touch</span></h2>
                        <p className="lead text-light opacity-75">Have questions about deployment, custom role configuration, or enterprise scaling? We're here to engineer a solution.</p>
                    </Col>
                </Row>
                <Row className="justify-content-center">
                    <Col lg={8}>
                        <div className="glass-card p-4 p-md-5">
                            {sent && <Alert variant="success" className="mb-4">Message transmitted securely! Our team will respond shortly.</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Row className="g-3 mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-light opacity-75 fw-bold">Full Name</Form.Label>
                                            <Form.Control type="text" placeholder="John Doe" className="bg-dark text-light border-secondary py-2" required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-light opacity-75 fw-bold">Email Address</Form.Label>
                                            <Form.Control type="email" placeholder="jack@example.com" className="bg-dark text-light border-secondary py-2" required />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-4">
                                    <Form.Label className="text-light opacity-75 fw-bold">Message Payload</Form.Label>
                                    <Form.Control as="textarea" rows={6} placeholder="Describe your inquiry..." className="bg-dark text-light border-secondary" required />
                                </Form.Group>
                                <Button className="btn-premium w-100 fs-5" type="submit">
                                    Initiate Uplink <i className="bi bi-send-fill ms-2"></i>
                                </Button>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};
