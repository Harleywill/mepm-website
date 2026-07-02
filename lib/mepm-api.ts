/**
 * MEPM Admin API Service
 *
 * Replaces localStorage calls from prototype.
 * All functions return data from the real backend API.
 */

import { apiFetch } from './api-client';

// ============================================================
// PROJECTS
// ============================================================

export async function getProjects() {
  const res = await apiFetch('/api/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getProject(id: string) {
  const res = await apiFetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function createProject(data: any) {
  const res = await apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function updateProject(id: string, data: any) {
  const res = await apiFetch(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function deleteProject(id: string) {
  const res = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

// ============================================================
// ENQUIRIES
// ============================================================

export async function getEnquiries() {
  const res = await apiFetch('/api/enquiries');
  if (!res.ok) throw new Error('Failed to fetch enquiries');
  return res.json();
}

export async function getEnquiry(id: string) {
  const res = await apiFetch(`/api/enquiries/${id}`);
  if (!res.ok) throw new Error('Failed to fetch enquiry');
  return res.json();
}

export async function updateEnquiry(id: string, data: any) {
  const res = await apiFetch(`/api/enquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update enquiry');
  return res.json();
}

export async function deleteEnquiry(id: string) {
  const res = await apiFetch(`/api/enquiries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete enquiry');
}

// ============================================================
// TEAM
// ============================================================

export async function getTeam() {
  const res = await apiFetch('/api/team');
  if (!res.ok) throw new Error('Failed to fetch team');
  return res.json();
}

export async function getTeamMember(id: string) {
  const res = await apiFetch(`/api/team/${id}`);
  if (!res.ok) throw new Error('Failed to fetch team member');
  return res.json();
}

export async function createTeamMember(data: any) {
  const res = await apiFetch('/api/team', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create team member');
  return res.json();
}

export async function updateTeamMember(id: string, data: any) {
  const res = await apiFetch(`/api/team/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update team member');
  return res.json();
}

export async function deleteTeamMember(id: string) {
  const res = await apiFetch(`/api/team/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete team member');
}

// ============================================================
// SERVICES
// ============================================================

export async function getServices() {
  const res = await apiFetch('/api/services');
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
}

export async function getService(id: string) {
  const res = await apiFetch(`/api/services/${id}`);
  if (!res.ok) throw new Error('Failed to fetch service');
  return res.json();
}

export async function createService(data: any) {
  const res = await apiFetch('/api/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create service');
  return res.json();
}

export async function updateService(id: string, data: any) {
  const res = await apiFetch(`/api/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update service');
  return res.json();
}

export async function deleteService(id: string) {
  const res = await apiFetch(`/api/services/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete service');
}

// ============================================================
// TESTIMONIALS
// ============================================================

export async function getTestimonials() {
  const res = await apiFetch('/api/testimonials');
  if (!res.ok) throw new Error('Failed to fetch testimonials');
  return res.json();
}

export async function getTestimonial(id: string) {
  const res = await apiFetch(`/api/testimonials/${id}`);
  if (!res.ok) throw new Error('Failed to fetch testimonial');
  return res.json();
}

export async function createTestimonial(data: any) {
  const res = await apiFetch('/api/testimonials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create testimonial');
  return res.json();
}

export async function updateTestimonial(id: string, data: any) {
  const res = await apiFetch(`/api/testimonials/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update testimonial');
  return res.json();
}

export async function deleteTestimonial(id: string) {
  const res = await apiFetch(`/api/testimonials/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete testimonial');
}

// ============================================================
// PERMISSIONS / ROLES
// ============================================================

export async function getRoles() {
  const res = await apiFetch('/api/roles');
  if (!res.ok) throw new Error('Failed to fetch roles');
  return res.json();
}

export async function canPerformAction(action: string): Promise<boolean> {
  try {
    const roles = await getRoles();
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// UTILITIES
// ============================================================

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function today(): string {
  return new Date().toISOString();
}
