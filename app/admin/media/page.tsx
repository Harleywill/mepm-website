'use client';

import { useEffect, useState, useMemo } from 'react';
import { ZoomIn } from 'lucide-react';
import { useToast } from '@/components/admin';
import { imageUrl } from '@/lib/projects';

interface MediaItem {
  src: string;
  label: string;
  project: string;
  kind: string;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState<MediaItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [toastNode, toast] = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRes, teamRes] = await Promise.all([
          fetch('/api/projects?admin=1'),
          fetch('/api/team'),
        ]);

        const projectsData = await projectsRes.json();
        const teamData = await teamRes.json();

        const mediaItems: MediaItem[] = [];

        // Projects images
        const projects = Array.isArray(projectsData) ? projectsData : projectsData.projects || [];
        projects.forEach((p: any) => {
          // Add project images from the images array
          if (p.images && Array.isArray(p.images)) {
            p.images.forEach((img: any) => {
              mediaItems.push({
                src: imageUrl(img.storedPath),
                label: img.caption || p.title,
                project: p.title,
                kind: img.isCover ? 'Cover image' : 'Gallery image',
              });
            });
          }
        });

        // Team photos
        const team = Array.isArray(teamData) ? teamData : teamData.team || [];
        team.forEach((m: any) => {
          if (m.photo) {
            mediaItems.push({
              src: '/' + m.photo.replace(/^public\//, ''),
              label: m.name,
              project: 'Team',
              kind: 'Team photo',
            });
          }
        });

        setItems(mediaItems);
      } catch (error) {
        console.error('Failed to load media:', error);
        toast('Failed to load media', 'AlertTriangle');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  // Get unique projects for filter
  const projects = useMemo(() => {
    const uniqueProjects = new Set(items.map((item) => item.project));
    return Array.from(uniqueProjects).sort();
  }, [items]);

  // Filter items by selected project
  const filteredItems = useMemo(() => {
    if (selectedProject === 'all') return items;
    return items.filter((item) => item.project === selectedProject);
  }, [items, selectedProject]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="mepm-h2 mb-1 text-navy-700">Media</h1>
        <p className="mepm-spec text-slate-500">
          {items.length} image{items.length !== 1 ? 's' : ''} — all uploaded across projects
          and the team
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="font-mono text-slate-400">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="mepm-spec text-slate-400">
            No media yet. Upload hero, gallery or team photos and they'll appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Project filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedProject('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: `1.5px solid ${selectedProject === 'all' ? 'var(--navy-600)' : 'var(--border)'}`,
                background: selectedProject === 'all' ? 'var(--navy-700)' : '#fff',
                color: selectedProject === 'all' ? '#fff' : 'var(--slate-600)',
                fontWeight: 600,
                fontSize: 13.5,
                cursor: 'pointer',
                transition: 'all var(--dur-fast)',
              }}
            >
              All
            </button>
            {projects.map((project) => (
              <button
                key={project}
                onClick={() => setSelectedProject(project)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: `1.5px solid ${selectedProject === project ? 'var(--navy-600)' : 'var(--border)'}`,
                  background: selectedProject === project ? 'var(--navy-700)' : '#fff',
                  color: selectedProject === project ? '#fff' : 'var(--slate-600)',
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  transition: 'all var(--dur-fast)',
                }}
              >
                {project}
              </button>
            ))}
          </div>

          {/* Media grid */}
          {filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
              <p className="mepm-spec text-slate-400">
                No images for "{selectedProject}".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setZoom(item)}
                  className="overflow-hidden rounded-md border border-slate-200 bg-black transition-shadow hover:shadow-md"
                >
                  <div className="relative">
                    <img
                      src={item.src}
                      alt={item.label}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all hover:bg-black/30">
                      <ZoomIn size={24} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>
                  <div className="bg-white px-3 py-2">
                    <div className="truncate font-body text-xs font-semibold text-navy-800">
                      {item.label}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400">
                      {item.project}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Zoom modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={zoom.src} alt={zoom.label} className="max-h-[90vh] w-auto" />
            <div className="absolute right-4 top-4">
              <button
                onClick={() => setZoom(null)}
                className="rounded-md bg-black/60 p-2 text-white hover:bg-black/80"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-6 py-4 text-white">
              <h3 className="font-display text-lg font-bold">{zoom.label}</h3>
              <p className="font-mono text-sm text-white/70">{zoom.project} — {zoom.kind}</p>
            </div>
          </div>
        </div>
      )}

      {toastNode}
    </div>
  );
}
