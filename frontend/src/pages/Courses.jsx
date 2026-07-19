import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursesAPI } from '../services/api';
import { Container, Row, Col, Spinner, Alert, Form, InputGroup, Button } from 'react-bootstrap';

export const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    const limit = 6;

    useEffect(() => {
        import('../services/api').then(({ usersAPI }) => {
            usersAPI.getMe().then(res => setCurrentUser(res.data || res)).catch(() => { });
        });
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const data = await coursesAPI.getAll(page, limit, searchQuery);
                setCourses(Array.isArray(data) ? data : data.courses || data.data || []);
                if (data.totalPages) setTotalPages(data.totalPages);
            } catch (err) {
                setError(err.message || 'Failed to fetch courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [page, searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearchQuery(searchInput);
    };

    if (loading && courses.length === 0) {
        return (
            <div className="premium-dark-section d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 76px)' }}>
                <Spinner animation="grow" variant="primary" />
            </div>
        );
    }

    if (error && courses.length === 0) {
        return (
            <div className="premium-dark-section py-5 hero-min-height">
                <Container>
                    <Alert variant="danger" className="shadow-sm border-0">{error}</Alert>
                </Container>
            </div>
        );
    }

    return (
        <div className="premium-dark-section bg-mesh hero-min-height py-5">
            <Container className="position-relative z-1">
                <div className="glow-effect" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, rgba(0,0,0,0) 70%)', top: '10%' }}></div>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 border-bottom border-light border-opacity-10 pb-4 gap-4">
                    <div>
                        <h2 className="display-5 fw-bold text-white mb-2">My <span className="gradient-text">Dashboard</span></h2>
                        <p className="text-light opacity-50 mb-0">Browse and manage your active learning curriculum.</p>
                    </div>
                    
                    <div className="d-flex flex-column flex-sm-row gap-3">
                        <Form onSubmit={handleSearch} style={{ minWidth: '250px' }}>
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="bg-dark text-light border-secondary"
                                    style={{ color: '#fff' }}
                                />
                                <Button type="submit" variant="primary">
                                    <i className="bi bi-search"></i>
                                </Button>
                            </InputGroup>
                        </Form>
                        
                        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'instructor') && (
                            <Link to="/course/new" className="btn btn-outline-light px-4 py-2 text-nowrap" style={{ borderRadius: '8px' }}>
                                <i className="bi bi-plus-lg me-2"></i>Create Course
                            </Link>
                        )}
                    </div>
                </div>

                {loading && courses.length > 0 && (
                    <div className="text-center mb-4">
                        <Spinner animation="grow" variant="primary" size="sm" />
                    </div>
                )}

                <Row xs={1} md={2} lg={3} className="g-4">
                    {!loading && courses.length === 0 ? (
                        <Col xs={12}>
                            <div className="glass-card p-5 text-center w-100 mt-4">
                                <i className="bi bi-journal-x display-1 text-light opacity-25 mb-4 d-block"></i>
                                <h4 className="text-white fw-bold">No Curriculum Available</h4>
                                <p className="text-light opacity-50 mb-0">
                                    {searchQuery ? "No courses matched your search." : "The academy is silent. Why not deploy the first module container?"}
                                </p>
                            </div>
                        </Col>
                    ) : (
                        courses.map(course => (
                            <Col key={course._id || course.id}>
                                <div className="glass-card p-4 p-md-5 h-100 d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="bi bi-journal-code text-primary fs-3 me-3"></i>
                                        <h4 className="fw-bold mb-0 text-white">{course.title}</h4>
                                    </div>
                                    <p className="text-light opacity-75 flex-grow-1 fs-6">{course.description}</p>
                                    <div className="mt-4 pt-4 border-top border-secondary border-opacity-25 w-100">
                                        <Link to={`/course/${course._id || course.id}`} className="btn-premium w-100 text-center d-block py-2 fw-bold">
                                            Access Module <i className="bi bi-arrow-right ms-2"></i>
                                        </Link>
                                    </div>
                                </div>
                            </Col>
                        ))
                    )}
                </Row>

                {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center mt-5 gap-3">
                        <button 
                            className="btn btn-outline-light px-4" 
                            disabled={page === 1} 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Previous
                        </button>
                        <span className="text-light opacity-75 fw-bold">
                            Page {page} of {totalPages}
                        </span>
                        <button 
                            className="btn btn-outline-light px-4" 
                            disabled={page >= totalPages} 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </button>
                    </div>
                )}
            </Container>
            <style>{`
                .form-control::placeholder {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
            `}</style>
        </div>
    );
};
