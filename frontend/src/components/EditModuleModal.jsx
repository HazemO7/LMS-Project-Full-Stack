import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { modulesAPI } from '../services/api';

export const EditModuleModal = ({ show, onHide, moduleData, onUpdate }) => {
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (moduleData) {
            setFormData({ title: moduleData.title || '', description: moduleData.description || '' });
        }
    }, [moduleData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const mId = moduleData._id || moduleData.id;
            const res = await modulesAPI.update(mId, formData);
            onUpdate(res.module || res.data || res);
            onHide();
        } catch (err) {
            setError(err.message || 'Failed to update module');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Edit Module Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Module Title</Form.Label>
                        <Form.Control type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Objective Description</Form.Label>
                        <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="w-100 fw-bold py-2 mt-2" disabled={loading}>
                        {loading ? 'Saving Changes...' : 'Save Module'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};
