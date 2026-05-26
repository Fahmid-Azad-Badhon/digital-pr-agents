'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { 
  Search, Calendar, Bell, Play, Users, Target, Zap, 
  ChevronDown, Activity, AlertTriangle, RefreshCw
} from 'lucide-react';
import clsx from 'clsx';

export default function TopNav() {
  const { campaigns, currentCampaign, setCurrentCampaign, refreshCampaigns, notifications } = useData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Last 7 Days');
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasCampaigns = campaigns.length > 0;
  const ACTIVE_STATUSES = new Set(['running', 'in_progress', 'processing', 'queued', 'repairing']);
  const activeCampaigns = campaigns.filter(c => ACTIVE_STATUSES.has((c.status || '').toLowerCase()));
  const activeCampaignCount = activeCampaigns.length;
  const campaignOptions = activeCampaigns.length > 0 ? activeCampaigns : campaigns;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] border-b border-[#334155]">
      {/* Left Side: Campaign Selector */}
      <div className="flex items-center gap-4">
        {!hasCampaigns ? (
          <span className="text-xs text-[#94A3B8]">No campaigns yet</span>
        ) : hasCampaigns && !currentCampaign ? (
          <div className="relative">
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:bg-[#273449]"
            >
              <Users size={16} />
              <span className="text-sm font-medium">{activeCampaignCount} campaigns available</span>
              <ChevronDown size={12} className="text-[#64748B]" />
            </button>
          </div>
        ) : currentCampaign ? (
          <button
            onClick={() => setSearchOpen(prev => !prev)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[#1E293B] transition-colors"
            title="Click to switch campaign"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Activity size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{currentCampaign.name}</p>
              <p className="text-xs text-[#94A3B8]">{currentCampaign.clientName}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span>Stage {currentCampaign.currentStage}/16</span>
              <span className="mx-1">-</span>
              <span>{Math.round((currentCampaign.currentStage / 16) * 100)}%</span>
            </div>
            <ChevronDown size={12} className={clsx('text-[#64748B] transition-transform', searchOpen && 'rotate-180')} />
          </button>
        ) : (
          <span className="text-xs text-[#94A3B8]">No active campaign</span>
        )}

        {hasCampaigns && (
          <div className="relative flex items-center gap-2">
            <select
              value={currentCampaign?.id || ''}
              onChange={(event) => {
                const selectedId = event.target.value;
                const selected = campaigns.find(c => c.id === selectedId) || null;
                setCurrentCampaign(selected);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] text-sm text-[#E5E7EB] focus:outline-none focus:border-primary"
            >
              {campaignOptions.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} (S{campaign.currentStage})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                void refreshCampaigns();
              }}
              className="p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-white hover:bg-[#273449]"
              title="Refresh campaigns"
            >
              <RefreshCw size={16} />
            </button>
            {searchOpen && (
              <div className="absolute top-11 left-0 z-30 w-80 max-h-72 overflow-auto rounded-lg border border-[#334155] bg-[#0F172A] shadow-xl">
                {campaignOptions.map(campaign => (
                  <button
                    key={campaign.id}
                    onClick={() => {
                      setCurrentCampaign(campaign);
                      setSearchOpen(false);
                    }}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-[#1E293B] border-b border-[#1E293B] last:border-b-0',
                      currentCampaign?.id === campaign.id && 'bg-[#1E293B]'
                    )}
                  >
                    <div className="text-sm text-white">{campaign.name}</div>
                    <div className="text-xs text-[#94A3B8]">Stage {campaign.currentStage}/16 • {campaign.status}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: Search */}
      <div className="flex-1 px-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search campaign, journalist, pitch, URL..."
            className="w-full px-4 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-white placeholder:text-[#64748B] focus:outline-none focus:border-primary"
          />
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        </div>
      </div>

      {/* Right Side: Actions */}
      <div className="flex items-center gap-4">
        {/* Date Range Filter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:bg-[#273449]">
          <Calendar size={16} />
          <span className="text-sm font-medium">{dateRange}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 rounded-lg hover:bg-[#1F2937] text-[#94A3B8]"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-xs text-green-300">System Online</span>
        </div>

        {/* Primary CTA */}
        <Link
          href="/campaigns/create"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover"
        >
          <Play size={18} />
          + New Campaign
        </Link>
      </div>
    </div>
  );
}
