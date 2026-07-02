'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TeamForm from '@/app/admin/TeamForm';
import type { TeamMemberDTO } from '@/lib/team';

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [member, setMember] = useState<TeamMemberDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/team/${id}`);
        if (!res.ok) throw new Error('Failed to fetch member');
        const data = await res.json();
        setMember(data.member || data);
      } catch (error) {
        console.error('Failed to load member:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PATCH',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update member');
      }
      router.push('/admin/team');
    } catch (error: any) {
      throw error;
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="font-mono text-slate-400">Loading…</span>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-700">
        Member not found
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="mepm-h2 text-navy-700">Edit team member</h1>
        <p className="mepm-spec mt-1 text-slate-500">Update {member.name}'s profile</p>
      </div>
      <TeamForm member={member} onSubmit={handleSubmit} loading={saveLoading} />
    </div>
  );
}
