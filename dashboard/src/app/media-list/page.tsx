'use client';

export default function MediaListPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Media List</h1>
      <p className="text-[#94A3B8]">Manage your targeted journalist and media outlet lists.</p>
      <div className="mt-8 p-4 bg-[#1E293B] border border-[#334155] rounded-xl">
        <p className="text-[#64748B] text-center py-8">No media contacts added</p>
      </div>
    </div>
  );
}