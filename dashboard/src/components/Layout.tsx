'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, PenTool, Activity, Target, FileBox, 
  Users, FileText, Mail, Package, CheckCircle, ScrollText, 
  Cpu, Menu, X, Settings, Shield, BarChart3, Search
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import clsx from 'clsx';
import TopNav from './header/TopNav';

const navGroups = [
  { section: 'MAIN', items: [
    { href: '/', icon: LayoutDashboard, label: 'Overview' },
    { href: '/workflow', icon: Activity, label: 'Workflow Monitor' },
    { href: '/approvals', icon: CheckCircle, label: 'Approval Queue' },
  ]},
  { section: 'CAMPAIGN BUILD', items: [
    { href: '/campaigns/create', icon: PenTool, label: 'S1 Campaign Intake' },
    { href: '/data-extraction', icon: FileText, label: 'S2 Data Extraction' },
    { href: '/research-enrichment', icon: Search, label: 'S3 Research Enrichment' },
    { href: '/analysis', icon: BarChart3, label: 'S4 Data & Research Analysis' },
    { href: '/angles', icon: Target, label: 'S5 Angle Generation' },
    { href: '/angle-selection', icon: Target, label: 'S6 Beat Matching' },
    { href: '/pitch-selection', icon: Target, label: 'S7 Pitch Selection' },
  ]},
  { section: 'OUTREACH', items: [
    { href: '/journalists', icon: Users, label: 'S8 Journalist Collection' },
    { href: '/media-list', icon: Users, label: 'S9 Journalist Intelligence' },
    { href: '/pitches', icon: FileText, label: 'S10 Pitch Drafting' },
    { href: '/optimization', icon: Mail, label: 'S11 Email Optimization' },
    { href: '/follow-up', icon: Mail, label: 'Follow-Up Tracker' },
  ]},
  { section: 'DELIVERY', items: [
    { href: '/artifacts', icon: FileBox, label: 'Artifact Manager' },
    { href: '/package', icon: Package, label: 'Google Doc Output' },
    { href: '/placements', icon: Activity, label: 'Placement Tracker' },
    { href: '/reporting', icon: BarChart3, label: 'Reporting' },
  ]},
  { section: 'SYSTEM', items: [
    { href: '/models', icon: Cpu, label: 'Model Routing' },
    { href: '/validation', icon: Shield, label: 'Validation Center' },
    { href: '/logs', icon: ScrollText, label: 'Logs & Errors' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#111827]">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed left-0 top-0 h-full bg-[#0F172A] border-r border-[#334155] z-30 transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#334155]">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <span className="text-white font-bold text-sm">PR</span>
              </div>
              <span className="text-white font-semibold text-sm">Digital PR</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-[#1F2937] text-[#94A3B8]"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navGroups.map(group => (
            <div key={group.section}>
              {sidebarOpen && (
                <div className="px-3 py-2 mt-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  {group.section}
                </div>
              )}
              {group.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive 
                        ? 'bg-primary/20 text-primary' 
                        : 'text-[#94A3B8] hover:bg-[#1F2937] hover:text-white'
                    )}
                  >
                    <item.icon size={20} />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        {sidebarOpen && (
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="p-3 rounded-lg bg-[#1E293B] border border-[#334155]">
              <p className="text-xs text-[#94A3B8] mb-2">Operating Principle</p>
              <p className="text-xs text-[#CBD5E1] italic">
                &ldquo;OpenCode produces volume. ChatGPT Plus protects quality.&rdquo;
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className={clsx('flex-1 transition-all duration-300', sidebarOpen ? 'ml-60' : 'ml-16')}>
        {/* Header - New Top Navigation */}
        <TopNav />

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
