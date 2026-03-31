import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI, modulesAPI, lessonsAPI, progressAPI } from '../services/api';
import { Container, Card, Accordion, Spinner, Alert, Ratio, Button, ProgressBar } from 'react-bootstrap';
import { CreateModuleModal } from '../components/CreateModuleModal';
import { CreateLessonModal } from '../components/CreateLessonModal';
import { EditCourseModal } from '../components/EditCourseModal';
import { EditModuleModal } from '../components/EditModuleModal';
import { EditLessonModal } from '../components/EditLessonModal';

export const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [enrolling, setEnrolling] = useState(false);

    const [progressData, setProgressData] = useState(null);
    const [markingComplete, setMarkingComplete] = useState(false);

    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [editingModule, setEditingModule] = useState(null);
    const [editingLesson, setEditingLesson] = useState(null);

    useEffect(() => {
        import('../services/api').then(({ usersAPI }) => {
            usersAPI.getMe().then(res => setCurrentUser(res.data)).catch(() => { });
        });
    }, []);

    const fetchCourseData = async () => {
        setLoading(true);
        setError('');
        try {
            const courseData = await coursesAPI.getByIdFull(id);
            setCourse(courseData.course || courseData.data || courseData);
            setAccessDenied(false);

            try {
                const pData = await progressAPI.getCourseProgress(id);
                setProgressData(pData);
            } catch (e) { }

        } catch (err) {
            if (err.message.includes('enrolled') || err.message.includes('Access denied')) {
                setAccessDenied(true);
                try {
                    const basicData = await coursesAPI.getById(id);
                    setCourse(basicData.data || basicData);
                } catch (basicErr) {
                    setError('Failed to load basic course information.');
                }
            } else {
                setError(err.message || 'Failed to fetch course details');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseData();
    }, [id]);

    const handleEnroll = async () => {
        setEnrolling(true);
        setError('');
        try {
            await coursesAPI.enroll(id);
            await fetchCourseData();
        } catch (err) {
            setError(err.message || 'Failed to enroll in course');
            setEnrolling(false);
        }
    };

    const handleModuleCreated = (newModule) => {
        setCourse(prev => ({
            ...prev,
            modules: [...(prev.modules || []), newModule]
        }));
    };

    const handleLessonCreated = (newLesson, moduleId) => {
        setCourse(prev => ({
            ...prev,
            modules: prev.modules.map(mod => {
                const mId = mod._id || mod.id;
                if (mId === moduleId) {
                    return { ...mod, lesson: [...(mod.lesson || []), newLesson] };
                }
                return mod;
            })
        }));
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" variant="primary" /></Container>;
    if (!course && !loading) return <Container className="mt-5"><Alert variant="danger">{error || "Course not found"}</Alert></Container>;

    const modules = course.modules || [];
    const isPopulated = modules.length > 0 && typeof modules[0] === 'object';

    return (
        <Container className="mt-4 mb-5">
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            <Card className="shadow-sm mb-4 border-0 bg-light">
                <Card.Body className="py-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="flex-grow-1 border-end border-secondary border-opacity-10 pe-4 me-2">
                        <Card.Title as="h2" className="mb-3 fw-bold display-6">{course.title}</Card.Title>
                        <Card.Text className="lead text-muted">{course.description}</Card.Text>

                        {progressData && (
                            <div className="mt-4 pt-2" style={{ maxWidth: '100%' }}>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fw-bold text-dark fs-6 d-flex align-items-center">
                                        <i className="bi bi-bar-chart-fill text-primary me-2"></i>Course Completion Progress
                                    </span>
                                    <span className="fw-bold text-success fs-6">{progressData.percentage}% ({progressData.completedCount}/{progressData.totalLessons})</span>
                                </div>
                                <ProgressBar now={progressData.percentage} variant="success" className="shadow-sm rounded-pill border border-success border-opacity-25" style={{ height: '14px' }} />
                                {progressData.percentage === 100 && (
                                    <div className="mt-2 text-success fw-bold d-flex align-items-center">
                                        <i className="bi bi-patch-check-fill fs-5 me-2"></i> Verified Graduation Module Completer
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {currentUser &&
                        (currentUser.role === 'admin' || (course.instructor && currentUser._id === course.instructor)) &&
                        (
                            <div className="d-flex gap-2">
                                <Button variant="outline-primary" onClick={() => setShowEditModal(true)}>✏️ Edit Course</Button>
                                <Button variant="success" onClick={() => setShowModuleModal(true)}>+ Add Module</Button>
                            </div>
                        )}
                </Card.Body>
            </Card>

            {accessDenied ? (
                <Card className="text-center py-5 shadow-sm border-0">
                    <Card.Body>
                        <i className="bi bi-lock-fill text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <h3 className="mt-3">Course Content is Locked!</h3>
                        <p className="text-muted">You must be officially enrolled to access the curriculum, modules, and lessons.</p>
                        <Button
                            variant="primary"
                            size="lg"
                            className="mt-3 px-5 fw-bold rounded-pill"
                            onClick={handleEnroll}
                            disabled={enrolling}
                        >
                            {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    {!isPopulated && modules.length > 0 && (
                        <Alert variant="warning">
                            Modules are not completely synced across the database.
                        </Alert>
                    )}

                    <h3 className="mb-4">Course Curriculum</h3>
                    {modules.length > 0 ? (
                        <Accordion alwaysOpen defaultActiveKey="0">
                            {modules.map((mod, index) => {
                                const mId = mod._id || mod.id || index;
                                return (
                                    <Accordion.Item eventKey={index.toString()} key={mId}>
                                        <Accordion.Header className="fw-bold">{mod.title || `Module ID: ${mod}`}</Accordion.Header>
                                        <Accordion.Body className="bg-light">
                                            {mod.title && (
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <p className="mb-0 text-muted">{mod.description}</p>

                                                    {currentUser && (currentUser.role === 'admin' || (course.instructor && currentUser._id === course.instructor)) && (
                                                        <div className="d-flex gap-2">
                                                            <Button variant="outline-secondary" size="sm" onClick={() => setEditingModule(mod)} title="Edit Module">✏️ Edit</Button>
                                                            <Button variant="outline-danger" size="sm" onClick={async () => {
                                                                if (window.confirm("Delete this module and all its lessons?")) {
                                                                    await modulesAPI.delete(mId);
                                                                    setCourse(prev => ({ ...prev, modules: prev.modules.filter(m => (m._id || m.id) !== mId) }));
                                                                }
                                                            }} title="Delete Module">🗑️</Button>
                                                            <Button variant="outline-primary" size="sm" onClick={() => {
                                                                setActiveModuleId(mId);
                                                                setShowLessonModal(true);
                                                            }}>+ Add Lesson</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {mod.lesson && mod.lesson.length > 0 ? (
                                                mod.lesson.map((lessonObj, lIndex) => {
                                                    if (typeof lessonObj === 'string') return <Card key={lessonObj} className="mb-2"><Card.Body>ID: {lessonObj}</Card.Body></Card>;
                                                    return (
                                                        <Card key={lessonObj._id || lessonObj.id || lIndex} className="mb-3 border border-1 shadow-sm">
                                                            <Card.Body>
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <Card.Title as="h5" className="mb-3">{lessonObj.title}</Card.Title>
                                                                    {currentUser && (currentUser.role === 'admin' || (course.instructor && currentUser._id === course.instructor)) && (
                                                                        <div className="d-flex gap-2">
                                                                            <Button variant="outline-secondary" size="sm" onClick={() => setEditingLesson(lessonObj)} title="Edit Lesson">✏️</Button>
                                                                            <Button variant="outline-danger" size="sm" onClick={async () => {
                                                                                if (window.confirm("Delete this lesson?")) {
                                                                                    const lId = lessonObj._id || lessonObj.id;
                                                                                    await lessonsAPI.delete(lId);
                                                                                    setCourse(prev => ({
                                                                                        ...prev,
                                                                                        modules: prev.modules.map(m => {
                                                                                            if ((m._id || m.id) === mId) {
                                                                                                return { ...m, lesson: m.lesson.filter(l => (l._id || l.id) !== lId) };
                                                                                            }
                                                                                            return m;
                                                                                        })
                                                                                    }));
                                                                                }
                                                                            }} title="Delete Lesson">🗑️</Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Card.Text className="mb-4 fs-6">{lessonObj.content}</Card.Text>
                                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 pt-3 border-top border-secondary border-opacity-10">
                                                                    {lessonObj.videoUrl ? (
                                                                        <a href={lessonObj.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm px-4 fw-bold shadow-sm rounded-pill">
                                                                            <i className="bi bi-play-circle-fill me-2 fs-5 align-middle"></i> Watch Media Material
                                                                        </a>
                                                                    ) : <div></div>}
                                                                    {progressData && progressData.completedLessons && (
                                                                        <Button
                                                                            variant={progressData.completedLessons.includes(lessonObj._id || lessonObj.id) ? "success" : "outline-success"}
                                                                            className="fw-bold px-4 rounded-pill d-flex align-items-center gap-2"
                                                                            disabled={markingComplete}
                                                                            onClick={async () => {
                                                                                setMarkingComplete(true);
                                                                                try {
                                                                                    await progressAPI.completeLesson(lessonObj._id || lessonObj.id, course._id || course.id);
                                                                                    const updatedP = await progressAPI.getCourseProgress(course._id || course.id);
                                                                                    setProgressData(updatedP);
                                                                                } catch (e) {
                                                                                    console.error(e);
                                                                                } finally {
                                                                                    setMarkingComplete(false);
                                                                                }
                                                                            }}
                                                                        >
                                                                            {progressData.completedLessons.includes(lessonObj._id || lessonObj.id) ? (
                                                                                <><i className="bi bi-check-circle-fill fs-5"></i> Completed</>
                                                                            ) : (
                                                                                <><i className="bi bi-circle fs-5"></i> Mark Complete</>
                                                                            )}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-muted mb-0 fst-italic">No lessons in this module.</p>
                                            )}
                                        </Accordion.Body>
                                    </Accordion.Item>
                                )
                            })}
                        </Accordion>
                    ) : (
                        <Alert variant="info">No modules available for this course yet.</Alert>
                    )}
                </>
            )}

            <CreateModuleModal
                show={showModuleModal}
                onHide={() => setShowModuleModal(false)}
                courseId={course?._id || course?.id}
                existingModules={modules}
                onModuleCreated={handleModuleCreated}
            />

            <CreateLessonModal
                show={showLessonModal}
                onHide={() => { setShowLessonModal(false); setActiveModuleId(null); }}
                moduleId={activeModuleId}
                existingLessons={modules.find(m => (m._id || m.id) === activeModuleId)?.lesson || []}
                onLessonCreated={handleLessonCreated}
            />

            <EditCourseModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                course={course}
                onUpdate={(updatedCourse) => setCourse(prev => ({ ...prev, ...updatedCourse }))}
            />

            <EditModuleModal
                show={!!editingModule}
                onHide={() => setEditingModule(null)}
                moduleData={editingModule}
                onUpdate={(updatedMod) => {
                    setCourse(prev => ({
                        ...prev,
                        modules: prev.modules.map(m => (m._id || m.id) === (updatedMod._id || updatedMod.id) ? { ...m, ...updatedMod } : m)
                    }));
                }}
            />

            <EditLessonModal
                show={!!editingLesson}
                onHide={() => setEditingLesson(null)}
                lessonData={editingLesson}
                onUpdate={(updatedLesson) => {
                    setCourse(prev => ({
                        ...prev,
                        modules: prev.modules.map(m => ({
                            ...m,
                            lesson: m.lesson ? m.lesson.map(l => (l._id || l.id) === (updatedLesson._id || updatedLesson.id) ? { ...l, ...updatedLesson } : l) : []
                        }))
                    }));
                }}
            />
        </Container>
    );
};
