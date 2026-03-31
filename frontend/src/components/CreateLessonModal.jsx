import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { lessonsAPI, modulesAPI } from '../services/api';

export const CreateLessonModal = ({ show, onHide, moduleId, existingLessons, onLessonCreated }) => {
    const [lessonData, setLessonData] = useState({ title: '', description: '', content: '', videoUrl: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setLessonData({ ...lessonData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Include module ID in lesson payload explicitly 
            const payload = { ...lessonData, module: moduleId };
            const newLessonRes = await lessonsAPI.create(payload);
            const newLesson = newLessonRes.data || newLessonRes;
            const lessonId = newLesson._id || newLesson;

            // Link to module
            const updatedLessons = existingLessons ? existingLessons.map(l => l._id || l) : [];
            if (lessonId) updatedLessons.push(lessonId);

            // Schema uses 'lesson' (singular) for the array of lessons in Module.js
            await modulesAPI.update(moduleId, { lesson: updatedLessons });

            onLessonCreated(newLesson, moduleId);
            onHide();
            setLessonData({ title: '', description: '', content: '', videoUrl: '' });
        } catch (err) {
            setError(err.message || "Failed to create lesson");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Lesson</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form.Group className="mb-3">
                        <Form.Label>Lesson Title</Form.Label>
                        <Form.Control type="text" name="title" value={lessonData.title} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control type="text" name="description" value={lessonData.description} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Reading Content</Form.Label>
                        <Form.Control as="textarea" rows={3} name="content" value={lessonData.content} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Video URL</Form.Label>
                        <Form.Control type="url" name="videoUrl" value={lessonData.videoUrl} onChange={handleChange} placeholder="https://..." />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Lesson'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
