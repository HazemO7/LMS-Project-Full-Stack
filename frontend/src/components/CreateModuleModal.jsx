import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { coursesAPI, modulesAPI } from '../services/api';

export const CreateModuleModal = ({
  show,
  onHide,
  courseId,
  existingModules = [],
  onModuleCreated,
}) => {
  const [moduleData, setModuleData] = useState({ title: '', description: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setModuleData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const newModuleRes = await modulesAPI.create(moduleData);
      const newModule = newModuleRes.data || newModuleRes;
      const moduleId = newModule._id || newModule.id || newModule;

      const updatedModules = existingModules.map((m) => m._id || m.id || m);
      if (moduleId) updatedModules.push(moduleId);

      await coursesAPI.update(courseId, { modules: updatedModules });

      onModuleCreated(newModule);
      onHide();
      setModuleData({ title: '', description: '', content: '' });
    } catch (err) {
      setError(err.message || 'Failed to create module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={show}
      onClose={onHide}
      title="Add module"
      description="Group related lessons into a structured curriculum section."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <div>
          <label htmlFor="create-module-title" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Module title
          </label>
          <input
            id="create-module-title"
            type="text"
            name="title"
            required
            value={moduleData.title}
            onChange={handleChange}
            placeholder="e.g. Module 1: Core Concepts"
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="create-module-desc" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Summary
          </label>
          <input
            id="create-module-desc"
            type="text"
            name="description"
            required
            value={moduleData.description}
            onChange={handleChange}
            placeholder="Short objective for this module"
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="create-module-content" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Overview notes
          </label>
          <textarea
            id="create-module-content"
            name="content"
            rows={3}
            required
            value={moduleData.content}
            onChange={handleChange}
            placeholder="What topics are covered in this module?"
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4">
          <button
            type="button"
            onClick={onHide}
            disabled={loading}
            className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F7F8FA]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save module'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
