'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Lock } from 'lucide-react';
import type { TeamMemberDTO } from '@/lib/team';

const DISCIPLINES = [
  { value: 'ELE', label: 'Electrical', color: '#ef6820' },
  { value: 'MEC', label: 'Mechanical', color: '#3b82f6' },
  { value: 'ENV', label: 'Environmental', color: '#10b981' },
];

interface TeamFormProps {
  member?: TeamMemberDTO | null;
  onSubmit: (formData: FormData) => Promise<void>;
  loading?: boolean;
}

export default function TeamForm({ member, onSubmit, loading = false }: TeamFormProps) {
  const [name, setName] = useState(member?.name || '');
  const [role, setRole] = useState(member?.role || '');
  const [discipline, setDiscipline] = useState(member?.discipline || 'ELE');
  const [bio, setBio] = useState(member?.bio || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(member?.photo || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role || null);
        }
      } catch (err) {
        console.error('Failed to fetch user role:', err);
      } finally {
        setLoadingRole(false);
      }
    };
    fetchUserRole();
  }, []);

  const canEditRole = userRole === 'administrator';

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !role.trim()) {
      setError('Name and role are required');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('role', role);
    formData.append('discipline', discipline);
    formData.append('bio', bio);
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {/* Photo Upload */}
      <div className="mb-8 rounded-lg border border-dashed border-slate-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            {photoPreview ? (
              <div className="flex items-center gap-4">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--navy-700)',
                    }}
                  >
                    Photo selected
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--slate-500)',
                      marginTop: 4,
                    }}
                  >
                    JPG, PNG, up to 5MB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--navy-700)',
                  }}
                >
                  Upload member photo
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--slate-500)',
                    marginTop: 4,
                  }}
                >
                  JPG, PNG, up to 5MB
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 font-body text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              <Upload size={16} /> {photoPreview ? 'Change' : 'Upload'}
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-2 text-red-600 hover:bg-red-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      {/* Form Fields */}
      <div className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 14,
              color: 'var(--navy-700)',
              marginBottom: '8px',
            }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mark Pennington"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
            }}
          />
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <label
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: 14,
                color: 'var(--navy-700)',
              }}
            >
              Role
            </label>
            {!canEditRole && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--slate-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                }}
              >
                <Lock size={12} /> Admin only
              </span>
            )}
          </div>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Founding Director"
            disabled={!canEditRole}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              backgroundColor: !canEditRole ? 'var(--slate-50)' : '#fff',
              color: !canEditRole ? 'var(--slate-400)' : 'var(--slate-900)',
              cursor: !canEditRole ? 'not-allowed' : 'text',
              opacity: !canEditRole ? 0.6 : 1,
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 14,
              color: 'var(--navy-700)',
              marginBottom: '8px',
            }}
          >
            Discipline
          </label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
            }}
          >
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 14,
              color: 'var(--navy-700)',
              marginBottom: '8px',
            }}
          >
            Bio / Description
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. 25 years across commercial, healthcare and education. Chartered Mechanical engineer..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(209, 67, 67, 0.05)',
            border: '1px solid rgba(209, 67, 67, 0.3)',
            color: '#D14343',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '10px 24px',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: '#68B830',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Saving…' : member ? 'Save changes' : 'Add member'}
      </button>
    </form>
  );
}
