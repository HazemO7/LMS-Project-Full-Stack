import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { modulesAPI, coursesAPI } from '../services/api';

export const CreateModuleModal = ({ show, onHide, courseId, existingModules, onModuleCreated }) => {
    const [moduleData, setModuleData] = useState({ title: '', description: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setModuleData({ ...moduleData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // 1. Create the module
            const newModuleRes = await modulesAPI.create(moduleData);
            const newModule = newModuleRes.data || newModuleRes;
            const moduleId = newModule._id || newModule;

            // 2. Update the course to link the module
            const updatedModules = existingModules.map(m => m._id || m) || [];
            if (moduleId) updatedModules.push(moduleId);

            await coursesAPI.update(courseId, { modules: updatedModules });

            onModuleCreated(newModule);
            onHide();
            setModuleData({ title: '', description: '', content: '' });
        } catch (err) {
            setError(err.message || "Failed to create module");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Module</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form.Group className="mb-3">
                        <Form.Label>Module Title</Form.Label>
                        <Form.Control type="text" name="title" value={moduleData.title} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control type="text" name="description" value={moduleData.description} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Content Overview</Form.Label>
                        <Form.Control as="textarea" rows={3} name="content" value={moduleData.content} onChange={handleChange} required />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Module'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
