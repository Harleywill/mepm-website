'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeamForm from '@/app/admin/TeamForm';

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create member');
      }
      router.push('/admin/team');
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="mepm-h2 text-navy-700">Add team member</h1>
        <p className="mepm-spec mt-1 text-slate-500">Create a new team member profile</p>
      </div>
      <TeamForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
