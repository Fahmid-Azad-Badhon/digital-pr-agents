'use client';

export default function FollowUpPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Follow-Up Tracker</h1>
      <p className="text-[#94A3B8]">Track follow-ups with journalists and media outlets.</p>
      <div className="mt-8 p-4 bg-[#1E293B] border border-[#334155] rounded-xl">
        <p className="text-[#64748B] text-center py-8">No follow-ups scheduled</p>
      </div>
    </div>
  );
}