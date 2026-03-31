import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI } from '../services/api';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';

export const CreateCourse = () => {
    const [courseData, setCourseData] = useState({ title: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCourseData({ ...courseData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await coursesAPI.create(courseData);
            const newCourseId = response.data?._id || response._id;
            navigate(`/course/${newCourseId || ''}`);
        } catch (err) {
            setError(err.message || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="premium-dark-section bg-mesh hero-min-height py-5">
            <Container className="position-relative z-1">
                <div className="glow-effect" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, rgba(0,0,0,0) 70%)', top: '20%' }}></div>
                <Row className="justify-content-center">
                    <Col lg={8}>
                        <div className="text-center mb-5">
                            <i className="bi bi-pencil-square display-4 text-primary mb-3 d-inline-block"></i>
                            <h2 className="display-5 fw-bold text-white mb-2">Build <span className="gradient-text">Curriculum</span></h2>
                            <p className="text-light opacity-50">Deploy a new course container to your platform.</p>
                        </div>

                        <div className="glass-card p-4 p-md-5 mx-auto">
                            {error && <Alert variant="danger" className="mb-4 shadow-sm border-0">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4" controlId="title">
                                    <Form.Label className="text-light opacity-75 fw-bold">Course Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={courseData.title}
                                        onChange={handleChange}
                                        className="bg-dark text-light border-secondary py-3 placeholder-white"
                                        required
                                        placeholder="Engineering 101"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-5" controlId="description">
                                    <Form.Label className="text-light opacity-75 fw-bold">Description Syllabus</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={6}
                                        name="description"
                                        value={courseData.description}
                                        onChange={handleChange}
                                        className="bg-dark text-light border-secondary placeholder-white"
                                        required
                                        placeholder="What will students learn in this module container?"
                                    />
                                </Form.Group>
                                <Button type="submit" className="btn-premium w-100 fs-5 py-3" disabled={loading}>
                                    {loading ? 'Compiling Container...' : 'Publish Course'} <i className="bi bi-cloud-arrow-up-fill ms-2"></i>
                                </Button>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
            <style>{`.placeholder-white::placeholder { color: rgba(255,255,255,0.3) !important; }`}</style>
        </div>
    );
};
