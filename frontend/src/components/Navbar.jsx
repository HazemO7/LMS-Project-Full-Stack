import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Container, Nav, Navbar as BootstrapNavbar, Button } from 'react-bootstrap';

export const Navbar = () => {
    const { userToken, logoutUser } = useContext(AuthContext);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (userToken) {
            import('../services/api').then(({ usersAPI }) => {
                usersAPI.getMe().then(res => setCurrentUser(res.data || res)).catch(() => { });
            });
        } else {
            setCurrentUser(null);
        }
    }, [userToken]);

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
            <Container>
                <BootstrapNavbar.Brand as={Link} to="/">LMS Project</BootstrapNavbar.Brand>
                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/"><i className="bi bi-house-door me-1"></i> Home</Nav.Link>
                        <Nav.Link as={Link} to="/about"><i className="bi bi-info-circle me-1"></i> About Us</Nav.Link>
                        <Nav.Link as={Link} to="/contact"><i className="bi bi-envelope me-1"></i> Contact</Nav.Link>
                        {userToken && (
                            <>
                                <Nav.Link as={Link} to="/courses" className="fw-bold"><i className="bi bi-grid-fill me-1"></i> My Dashboard</Nav.Link>
                                {currentUser && (currentUser.role === 'admin' || currentUser.role === 'instructor') && (
                                    <Nav.Link as={Link} to="/course/new"><i className="bi bi-plus-circle me-1"></i> Create Course</Nav.Link>
                                )}
                            </>
                        )}
                    </Nav>
                    <Nav className="align-items-center">
                        {userToken ? (
                            <div className="d-flex align-items-center gap-3">
                                <Link to="/profile" className="d-flex align-items-center text-light text-opacity-75 text-decoration-none hover-primary transition-all" title="My Account">
                                    <i className="bi bi-person-circle fs-4 me-2"></i>
                                    <span className="fw-bold">Profile</span>
                                </Link>
                                <div className="vr text-light mx-2 text-opacity-25 h-100" style={{ minHeight: '30px' }}></div>
                                <Button variant="outline-danger" size="sm" onClick={handleLogout} className="px-3 fw-bold rounded-pill shadow-sm">
                                    Logout <i className="bi bi-box-arrow-right ms-1"></i>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Nav.Link as={Link} to="/register" className="ms-2 btn btn-primary text-white">Register</Nav.Link>
                            </>
                        )}
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>
    );
};
