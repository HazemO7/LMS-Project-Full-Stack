import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { lessonsAPI } from '../services/api';

export const EditLessonModal = ({ show, onHide, lessonData, onUpdate }) => {
    const [formData, setFormData] = useState({ title: '', content: '', videoUrl: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lessonData) {
            setFormData({ title: lessonData.title || '', content: lessonData.content || '', videoUrl: lessonData.videoUrl || '' });
        }
    }, [lessonData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const lId = lessonData._id || lessonData.id;
            const res = await lessonsAPI.update(lId, formData);
            onUpdate(res.lesson || res.data || res);
            onHide();
        } catch (err) {
            setError(err.message || 'Failed to update lesson');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Edit Lesson Payload</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Lesson Title</Form.Label>
                        <Form.Control type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Content Transcript</Form.Label>
                        <Form.Control as="textarea" rows={4} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Video Link Access</Form.Label>
                        <Form.Control type="url" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
                        <Form.Text className="text-muted">Enter a valid HTTP media URL.</Form.Text>
                    </Form.Group>
                    <Button variant="primary" type="submit" className="w-100 fw-bold py-2 mt-2" disabled={loading}>
                        {loading ? 'Saving Changes...' : 'Save Lesson'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};
