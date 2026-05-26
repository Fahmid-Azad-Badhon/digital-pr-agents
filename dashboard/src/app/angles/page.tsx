'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { Angle } from '@/types';
import { 
  Star, X, Check, Filter, SortAsc, Grid, List,
  Target, AlertTriangle, ChevronDown, BarChart3, Clock, Users, Shield
} from 'lucide-react';
import clsx from 'clsx';
import StageHeader from '@/components/StageHeader';
import { apiFetch } from '@/lib/clientApi';

const mockAngles: Angle[] = [
  // Pedestrian Safety - based on Premier Law Group campaign data (7,314 pedestrian fatalities in 2023)
  { id: 1, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Data Journalism'], headline: '7,314 Pedestrian Deaths in 2023: Nearly 1 in 5 U.S. Traffic Fatalities', whyNewsworthy: '2023 pedestrian fatalities account for 19.4% of all traffic deaths, the highest share in a decade, creating urgency for road safety policy.', score: 9, newsworthiness: 9, timeliness: 9, outreachDifficulty: 4, publicationType: 'National News', localNational: 'National', status: 'pending', notes: '' },
  { id: 2, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'State Politics'], headline: 'New Mexico Is America\'s Most Dangerous State for Pedestrians at 4.93 Deaths Per 100K', whyNewsworthy: 'Per-capita pedestrian fatality rate in New Mexico is nearly 5 per 100,000 residents, more than double the national average.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 3, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Transportation'], headline: 'December Is the Deadliest Month for Pedestrian Fatalities With 741 Deaths', whyNewsworthy: 'December accounts for 10.1% of all pedestrian deaths, tied to winter darkness, holiday travel, and alcohol-impaired driving.', score: 9, newsworthiness: 8, timeliness: 9, outreachDifficulty: 4, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
  { id: 4, category: 'Pedestrian Safety', journalistBeats: ['Automotive', 'Consumer Affairs'], headline: 'Passenger Cars, SUVs, and Pickups Account for 75% of Pedestrian Fatalities', whyNewsworthy: '75% of pedestrian deaths involve the most common vehicle classes on U.S. roads, raising design and safety questions.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Trade Publication', localNational: 'National', status: 'pending', notes: '' },
  { id: 5, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Data Journalism'], headline: 'Alcohol Is Present in Nearly Half of All Fatal Pedestrian Crashes', whyNewsworthy: '46% of fatal pedestrian crashes involve alcohol impairment - 30% pedestrians and 16% drivers over legal limit.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'National News', localNational: 'National', status: 'pending', notes: '' },
  { id: 6, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'State Politics'], headline: 'Arizona and South Carolina Join New Mexico as Top Pedestrian Danger States', whyNewsworthy: 'Southwest and Southeast states cluster at the top of per-capita pedestrian fatality rankings, showing regional risk patterns.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 7, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Local Government'], headline: 'King County Accounts for 32% of Washington\'s 150 Pedestrian Deaths', whyNewsworthy: 'King County\'s 48 pedestrian deaths represent nearly a third of Washington state\'s total, creating a local safety crisis.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'Local TV', localNational: 'Local', status: 'pending', notes: '' },
  { id: 8, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Weekend Safety'], headline: 'Friday Through Sunday Account for Nearly Half of All Pedestrian Deaths', whyNewsworthy: '46.8% of pedestrian fatalities occur Friday through Sunday, with Saturday alone recording 1,150 deaths (15.7%).', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
  { id: 9, category: 'Pedestrian Safety', journalistBeats: ['Health', 'Public Safety'], headline: 'Adults 21-44 Show Highest Alcohol Involvement in Pedestrian Fatalities', whyNewsworthy: 'Working-age adults ages 21-44 have the highest BAC involvement rates among killed pedestrians, raising prevention targeting questions.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 10, category: 'Pedestrian Safety', journalistBeats: ['Urban Planning', 'Transportation'], headline: 'Pedestrian Deaths Rise as SUVs and Pickups Dominate Vehicle Sales', whyNewsworthy: 'SUV and pickup market share growth correlates with rising pedestrian fatality rates, with larger vehicles creating new blind spots.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'Trade Publication', localNational: 'National', status: 'pending', notes: '' },
  { id: 11, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Local Government'], headline: 'Florida and Louisiana Show High Pedestrian Fatality Concentrations', whyNewsworthy: 'Southern states show consistently high raw pedestrian death totals, driven by urbanization, climate, and road design factors.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Local TV', localNational: 'Local', status: 'pending', notes: '' },
  { id: 12, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Seasonal'], headline: 'Winter Months Create Perfect Storm for Pedestrian Danger', whyNewsworthy: 'Shorter days, holiday alcohol consumption, and winter weather combine to make December through February highest-risk months.', score: 8, newsworthiness: 8, timeliness: 8, outreachDifficulty: 5, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
  { id: 13, category: 'Pedestrian Safety', journalistBeats: ['Legal', 'Public Safety'], headline: 'Pedestrian Fatality Data Creates Legal Accountability Angles for Victims', whyNewsworthy: 'Location-specific fatality data supports personal injury claims and public safety policy advocacy, particularly in high-risk corridors.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Trade Publication', localNational: 'National', status: 'pending', notes: '' },
  { id: 14, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Urban Planning'], headline: 'Per-Capita Rankings Reveal State Pedestrian Safety Failures', whyNewsworthy: 'Per-100,000 fatality rates expose states that raw totals miss, showing New Mexico, Arizona, and South Carolina as top risks.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 15, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Transportation'], headline: 'Nighttime Pedestrian Deaths Account for Majority of Fatal Crashes', whyNewsworthy: 'Dark conditions account for majority of pedestrian fatalities, with limited street lighting and visibility as key factors.', score: 8, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'National News', localNational: 'National', status: 'pending', notes: '' },
  { id: 16, category: 'Pedestrian Safety', journalistBeats: ['Local Government', 'Infrastructure'], headline: 'Urban Streets Need Better Pedestrian Crossing Infrastructure', whyNewsworthy: 'Intersections and crosswalks remain top pedestrian danger zones, with infrastructure improvements lagging vehicle safety advances.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Local TV', localNational: 'Local', status: 'pending', notes: '' },
  { id: 17, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Public Health'], headline: 'Pedestrian Deaths Now Represent 1 in 5 Traffic Fatalities Nationally', whyNewsworthy: 'Pedestrian share of traffic deaths increased from 13% in 2010 to nearly 20% in 2023, showing shifting risk patterns.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
  { id: 18, category: 'Pedestrian Safety', journalistBeats: ['State Politics', 'Public Safety'], headline: 'States With Weak Pedestrian Protections See Higher Fatality Rates', whyNewsworthy: 'States lacking dedicated pedestrian safety programs and infrastructure investment show higher per-capita fatality rates.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 19, category: 'Pedestrian Safety', journalistBeats: ['Automotive', 'Safety Policy'], headline: 'Vehicle Design Standards Need Update for Pedestrian Protection', whyNewsworthy: 'Current vehicle safety standards focus on occupants, not pedestrians, creating regulatory gaps as larger vehicles dominate roads.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Trade Publication', localNational: 'National', status: 'pending', notes: '' },
  { id: 20, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Local News'], headline: 'County-Level Pedestrian Fatality Data Reveals Local Hotspots', whyNewsworthy: 'Within-state county and city data reveals concentrated danger zones that state-level data masks, enabling local coverage.', score: 8, newsworthiness: 8, timeliness: 8, outreachDifficulty: 5, publicationType: 'Local TV', localNational: 'Local', status: 'pending', notes: '' },
  // Top States / Counties / Cities format (matching user's examples)
  { id: 21, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'State Rankings'], headline: 'Top States Where Pedestrian Deaths Are Highest Per Capita', whyNewsworthy: 'Per-capita rankings reveal New Mexico (4.93), Arizona (3.78), and South Carolina (3.52) as most dangerous states.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'National News', localNational: 'National', status: 'pending', notes: '' },
  { id: 22, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'State Rankings'], headline: 'Top States With the Most Pedestrian Fatalities in 2023', whyNewsworthy: 'California (4,015), Texas (3,314), and Florida (3,116) lead raw totals, but per-capita rates tell a different story.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 23, category: 'Pedestrian Safety', journalistBeats: ['Local News', 'Public Safety'], headline: 'Top Counties Where Pedestrian Deaths Are Most Concentrated', whyNewsworthy: 'Los Angeles, Miami-Dade, and Harris County lead in raw pedestrian deaths, showing urban concentration of risk.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Local TV', localNational: 'Local', status: 'pending', notes: '' },
  { id: 24, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Seasonal'], headline: 'Top Months Where Pedestrian Fatalities Spike', whyNewsworthy: 'December (741), October (684), and November (654) show seasonal peaks tied to darkness and holiday travel.', score: 8, newsworthiness: 8, timeliness: 8, outreachDifficulty: 5, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
  { id: 25, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Vehicle Types'], headline: 'Top Vehicle Types Involved in Pedestrian Deaths', whyNewsworthy: 'Passenger cars (51%), SUVs (19%), and pickup trucks (14%) together account for 84% of pedestrian fatality vehicles.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Trade Publication', localNational: 'National', status: 'pending', notes: '' },
  { id: 26, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Alcohol'], headline: 'Top States Where Alcohol-Impaired Pedestrian Deaths Are Highest', whyNewsworthy: '46% of pedestrian fatal crashes involve alcohol, with highest rates in states with less stringent DUI enforcement.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'National News', localNational: 'National', status: 'pending', notes: '' },
  { id: 27, category: 'Pedestrian Safety', journalistBeats: ['Local News', 'Infrastructure'], headline: 'Top Cities Where Pedestrian Infrastructure Lags Behind Growth', whyNewsworthy: 'Fast-growing Sun Belt cities show pedestrian infrastructure failing to keep pace with population and traffic growth.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'Local', status: 'pending', notes: '' },
  { id: 28, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Age Groups'], headline: 'Top Age Groups Affected by Pedestrian Fatalities', whyNewsworthy: 'Adults 30-50 account for largest share of pedestrian deaths, followed by 50-70 age group, showing working-age risk.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
  { id: 29, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Weekend'], headline: 'Top Days of Week for Pedestrian Fatalities', whyNewsworthy: 'Saturday leads with 1,150 deaths, followed by Sunday (1,116) and Friday (1,085), showing weekend danger pattern.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Trade Publication', localNational: 'National', status: 'pending', notes: '' },
  { id: 30, category: 'Pedestrian Safety', journalistBeats: ['Local News', 'Washington'], headline: 'Top Washington Counties for Pedestrian Danger', whyNewsworthy: 'King County (48 deaths, 32% of state total), Pierce (23), and Spokane (19) show concentrated western Washington risk.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'Local TV', localNational: 'Local', status: 'pending', notes: '' },
  { id: 31, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Road Types'], headline: 'Top Road Types Where Pedestrian Deaths Occur', whyNewsworthy: 'Arterial roads and highways account for majority of pedestrian fatalities, with intersections as top danger points.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 32, category: 'Pedestrian Safety', journalistBeats: ['Urban Planning', 'Policy'], headline: 'Top Cities Where Vision Zero Goals Are Falling Behind', whyNewsworthy: 'Most U.S. cities are behind on Vision Zero commitments, with pedestrian deaths increasing despite safety pledges.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
  { id: 33, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Time of Day'], headline: 'Top Time Periods for Pedestrian Danger', whyNewsworthy: 'Evening rush hour (5-8 PM) and late night (9 PM-12 AM) account for highest pedestrian fatality concentrations.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Trade Publication', localNational: 'National', status: 'pending', notes: '' },
  { id: 34, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'State Comparison'], headline: 'Top States Where Pedestrian Risk Varies Most by Region', whyNewsworthy: 'Southern and Southwestern states show highest per-capita pedestrian risk, while Northeast shows lower rates despite urban density.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 35, category: 'Pedestrian Safety', journalistBeats: ['Legal', 'Accountability'], headline: 'Top Legal Questions Emerging From Pedestrian Death Data', whyNewsworthy: 'Municipal liability, road design negligence, and vehicle design responsibility create new legal angles from fatality data.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Trade Publication', localNational: 'National', status: 'pending', notes: '' },
  { id: 36, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Prevention'], headline: 'Top Prevention Strategies Backed by Pedestrian Fatality Data', whyNewsworthy: 'Data shows infrastructure improvements, enforcement, and vehicle design changes have proven effective in reducing deaths.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
  { id: 37, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Year-Over-Year'], headline: 'Top Trends in Pedestrian Fatality Changes Since 2020', whyNewsworthy: 'Pedestrian deaths increased 13% since 2020 despite fewer vehicle miles driven, showing changing risk dynamics.', score: 8, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'National News', localNational: 'National', status: 'pending', notes: '' },
  { id: 38, category: 'Pedestrian Safety', journalistBeats: ['Local News', 'Florida'], headline: 'Top Florida Counties for Pedestrian Danger', whyNewsworthy: 'Miami-Dade (411), Broward (252), and Hillsborough (147) lead Florida pedestrian deaths, showing statewide crisis.', score: 9, newsworthiness: 9, timeliness: 8, outreachDifficulty: 4, publicationType: 'Local TV', localNational: 'Local', status: 'pending', notes: '' },
  { id: 39, category: 'Pedestrian Safety', journalistBeats: ['Data Journalism', 'Comparison'], headline: 'Top U.S. States Compared to Other Countries on Pedestrian Safety', whyNewsworthy: 'U.S. pedestrian fatality rate is 2-3x higher than European countries with comparable vehicle miles and urban density.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Digital News', localNational: 'National', status: 'pending', notes: '' },
  { id: 40, category: 'Pedestrian Safety', journalistBeats: ['Public Safety', 'Policy'], headline: 'Top Federal Policy Changes Needed to Reduce Pedestrian Deaths', whyNewsworthy: 'Vehicle design standards, infrastructure funding priorities, and data collection could reduce pedestrian fatalities significantly.', score: 8, newsworthiness: 8, timeliness: 7, outreachDifficulty: 5, publicationType: 'Newspaper', localNational: 'National', status: 'pending', notes: '' },
];

export default function AnglesPage() {
  const router = useRouter();
  const { currentCampaign, angles, updateAngles, selectAngle, stages, addLog, addNotification } = useData();
  const [localAngles, setLocalAngles] = useState<Angle[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'newsworthiness' | 'timeliness'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compareMode, setCompareMode] = useState<number[]>([]);
  const [selectedForAction, setSelectedForAction] = useState<number | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const [dataWarning, setDataWarning] = useState<string | null>(null);

  const analysisStage = stages.find(s => s.stageNumber === 4);
  const angleStage = stages.find(s => s.stageNumber === 5);
  const beatMatchStage = stages.find(s => s.stageNumber === 6);
  const isAnalysisComplete = analysisStage?.status === 'completed';
  const isCompleted = angleStage?.status === 'completed';
  const isBeatMatching = beatMatchStage?.status === 'running';

  // Load grounded angles from campaign artifacts API
  useEffect(() => {
    let cancelled = false;

    const loadGroundedAngles = async () => {
      if (!currentCampaign?.id) {
        if (!cancelled) {
          setLocalAngles([]);
          setHasRealData(false);
          setDataWarning('No active campaign selected.');
        }
        return;
      }

      try {
        const response = await apiFetch(`/api/angles?campaignId=${encodeURIComponent(currentCampaign.id)}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) {
            setLocalAngles([]);
            setHasRealData(false);
            if (response.status === 404) {
              setDataWarning('No grounded angles generated yet. Run Stage 5 (Angle Generation) and Stage 6 (Beat Matching) first.');
            } else {
              setDataWarning(`Failed to load grounded angles (HTTP ${response.status}).`);
            }
          }
          return;
        }

        const payload = await response.json();
        const apiAngles = Array.isArray(payload?.data)
          ? (payload.data as Angle[])
          : Array.isArray(payload)
            ? (payload as Angle[])
            : [];

        if (!cancelled) {
          setLocalAngles(apiAngles);
          updateAngles(apiAngles);
          setHasRealData(apiAngles.length > 0);
          setDataWarning(apiAngles.length > 0 ? null : 'No grounded angles generated yet. Run Stage 5 and Stage 6.');
        }
      } catch (error) {
        if (!cancelled) {
          setLocalAngles([]);
          setHasRealData(false);
          setDataWarning(`Failed to load grounded angles: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    void loadGroundedAngles();

    return () => {
      cancelled = true;
    };
  }, [currentCampaign?.id, updateAngles]);

  // Auto-advance to Stage 5 (Beat Matching) when Stage 4 completes
  useEffect(() => {
    if (isCompleted && !isBeatMatching) {
      router.push('/angle-selection');
    }
  }, [isCompleted, isBeatMatching, router]);

  const filteredAngles = localAngles
    .filter(a => filter === 'all' || a.category === filter || a.status === filter)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const categories = Array.from(new Set(localAngles.map(a => a.category)));

  const handleFavorite = (id: number) => {
    setLocalAngles(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'favorite' ? 'pending' : 'favorite' } : a
    ));
  };

  const handleReject = (id: number) => {
    setLocalAngles(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'rejected' ? 'pending' : 'rejected' } : a
    ));
  };

  const handleToggleCompare = (id: number) => {
    setCompareMode(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleSelectAngle = (id: number) => {
    setSelectedForAction(id);
  };

  const confirmSelection = () => {
    if (selectedForAction === null) return;
    
    setLocalAngles(prev => prev.map(a => ({
      ...a,
      status: a.id === selectedForAction ? 'selected' : a.status === 'selected' ? 'pending' : a.status
    })));
    
    updateAngles(localAngles);
    selectAngle(selectedForAction);
    
    addLog({ level: 'success', source: 'angles', message: `Angle ${selectedForAction} selected. Workflow continuing.` });
    addNotification({ type: 'success', title: 'Angle Confirmed', message: 'Selection confirmed. Workflow resuming...' });
    
    setTimeout(() => {
      router.push('/workflow');
    }, 1500);
  };

  if (!currentCampaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle size={48} className="text-warning mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Active Campaign</h3>
        <p className="text-[#94A3B8]">Create a campaign first to access angle selection.</p>
      </div>
    );
  }

  const selectedCount = localAngles.filter(a => a.status === 'selected').length;

  return (
    <div className="space-y-6">
      <StageHeader stageNumber={5} stageName="Angle Generation" agentId="strategist" />
      
      {/* Anti-Hallucination Reminder */}
      {!isAnalysisComplete ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-400 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-red-400">Stage 4 Must Be Completed First</h4>
              <p className="text-sm text-red-200 mt-1">
                Angle Generation cannot proceed without Data & Research Analysis (Stage 4). 
                Go to <span className="font-mono text-red-300">/analysis</span> to complete Stage 4 and generate 04-analysis.md.
              </p>
              <button 
                onClick={() => router.push('/analysis')}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
              >
                Go to Stage 4: Data & Research Analysis
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="text-emerald-400 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-emerald-400">Stage 4 Complete - Approved Evidence Available</h4>
              <p className="text-sm text-emerald-200 mt-1">
                04-analysis.md has been generated. Angle Generation must use only verified statistics, 
                approved findings, and recommended angle directions from Stage 4. Do not use random, 
                static, or unverified content.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Grounding Warning */}
      {dataWarning && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-amber-400">Data Grounding Warning</h4>
              <p className="text-sm text-amber-200 mt-1">{dataWarning}</p>
              {!hasRealData && (
                <div className="mt-2 flex gap-2">
                  <button 
                    onClick={() => router.push('/campaigns/create')}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-sm"
                  >
                    Create Campaign
                  </button>
                  <button 
                    onClick={() => router.push('/workflow')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm"
                  >
                    Go to Workflow
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Angle Generation</h1>
          <p className="text-[#94A3B8] mt-1">
            {localAngles.length} AI-generated pitch angles • Auto-advances to Beat Matching (Stage 6) • Pitch Selection at Stage 7 (Human Gate)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'px-3 py-1.5 rounded-lg text-sm',
            isCompleted ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
          )}>
            {isCompleted ? 'Angles Generated' : 'Generating...'}
          </span>
        </div>
      </div>

      {/* Auto-Advance Notification */}
      {isCompleted && (
        <div className="bg-primary/20 border border-primary rounded-xl p-4 flex items-center gap-4">
          <Clock size={24} className="text-primary flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-white font-medium">Angle Generation Complete</p>
            <p className="text-sm text-[#94A3B8]">
              Automatically advancing to Beat Matching (Stage 6). Pitch Selection happens at Stage 7 (Human Gate).
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{localAngles.length}</div>
            <div className="text-xs text-[#64748B]">Angles</div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <span className="text-sm text-[#94A3B8]">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {(localAngles.reduce((acc, a) => acc + a.score, 0) / localAngles.length).toFixed(1)}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-warning" />
            <span className="text-sm text-[#94A3B8]">Favorites</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {localAngles.filter(a => a.status === 'favorite').length}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <X size={18} className="text-error" />
            <span className="text-sm text-[#94A3B8]">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {localAngles.filter(a => a.status === 'rejected').length}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-success" />
            <span className="text-sm text-[#94A3B8]">Selected</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {selectedCount}
          </p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex items-center justify-between bg-[#1E293B] border border-[#334155] rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#64748B]" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-[#273449] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="favorite">Favorites Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <SortAsc size={16} className="text-[#64748B]" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[#273449] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="score">Sort by Score</option>
              <option value="newsworthiness">Sort by Newsworthiness</option>
              <option value="timeliness">Sort by Timeliness</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-lg',
              viewMode === 'grid' ? 'bg-primary text-white' : 'bg-[#273449] text-[#94A3B8]'
            )}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-lg',
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-[#273449] text-[#94A3B8]'
            )}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Compare Mode */}
      {compareMode.length > 0 && (
        <div className="bg-[#1E293B] border border-manual rounded-xl p-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Users size={18} className="text-manual" />
            Compare Mode ({compareMode.length} angles)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {compareMode.map(id => {
              const angle = localAngles.find(a => a.id === id);
              if (!angle) return null;
              return (
                <div key={id} className="bg-[#273449] rounded-lg p-3">
                  <p className="text-xs text-[#64748B] mb-1">Angle {id}</p>
                  <p className="text-sm text-white line-clamp-2">{angle.headline}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Score: {angle.score}</span>
                    <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">{angle.localNational}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Angles Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAngles.map(angle => (
            <div
              key={angle.id}
              className={clsx(
                'bg-[#1E293B] border rounded-xl p-4 transition-all hover:scale-[1.02]',
                angle.status === 'selected' && 'border-success bg-success/10',
                angle.status === 'favorite' && 'border-warning bg-warning/10',
                angle.status === 'rejected' && 'border-error bg-error/10 opacity-50',
                !angle.status || angle.status === 'pending' && 'border-[#334155] hover:border-primary/50'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-[#64748B]">#{angle.id}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFavorite(angle.id)}
                    className={clsx(
                      'p-1 rounded',
                      angle.status === 'favorite' ? 'text-warning' : 'text-[#64748B] hover:text-warning'
                    )}
                  >
                    <Star size={14} fill={angle.status === 'favorite' ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleReject(angle.id)}
                    className={clsx(
                      'p-1 rounded',
                      angle.status === 'rejected' ? 'text-error' : 'text-[#64748B] hover:text-error'
                    )}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              
              <div className="mb-2">
                <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded">{angle.category}</span>
              </div>
              
              <h4 className="text-sm font-medium text-white line-clamp-2 mb-2">{angle.headline}</h4>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <BarChart3 size={12} className="text-[#64748B]" />
                  <span className="text-xs text-[#94A3B8]">{angle.score}/10</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-[#64748B]" />
                  <span className="text-xs text-[#94A3B8]">{angle.timeliness}/10</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {angle.journalistBeats.map((beat, i) => (
                  <span key={i} className="text-xs bg-[#273449] text-[#94A3B8] px-2 py-0.5 rounded">
                    {beat}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-[#334155]">
                <button
                  onClick={() => handleToggleCompare(angle.id)}
                  className={clsx(
                    'text-xs',
                    compareMode.includes(angle.id) ? 'text-manual' : 'text-[#64748B] hover:text-white'
                  )}
                >
                  {compareMode.includes(angle.id) ? 'Comparing' : 'Compare'}
                </button>
                <button
                  onClick={() => handleSelectAngle(angle.id)}
                  className={clsx(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                    selectedForAction === angle.id 
                      ? 'bg-success text-white' 
                      : 'bg-primary/20 text-primary hover:bg-primary/30'
                  )}
                >
                  <Check size={12} />
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAngles.map(angle => (
            <div
              key={angle.id}
              className={clsx(
                'bg-[#1E293B] border rounded-xl p-4 flex items-center gap-4',
                angle.status === 'selected' && 'border-success bg-success/10',
                angle.status === 'rejected' && 'border-error bg-error/10 opacity-50',
                !angle.status || angle.status === 'pending' && 'border-[#334155]'
              )}
            >
              <div className="flex items-center gap-2 w-16">
                <span className="text-sm font-bold text-[#64748B]">#{angle.id}</span>
                {getStatusIndicator(angle.status)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded">{angle.category}</span>
                  <span className="text-xs text-[#64748B]">{angle.localNational}</span>
                </div>
                <h4 className="text-sm font-medium text-white">{angle.headline}</h4>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xs text-[#64748B]">Score</div>
                  <div className="font-bold text-white">{angle.score}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#64748B]">News</div>
                  <div className="font-bold text-white">{angle.newsworthiness}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#64748B]">Time</div>
                  <div className="font-bold text-white">{angle.timeliness}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFavorite(angle.id)}
                  className={clsx(
                    'p-2 rounded-lg',
                    angle.status === 'favorite' ? 'bg-warning/20 text-warning' : 'bg-[#273449] text-[#64748B]'
                  )}
                >
                  <Star size={16} fill={angle.status === 'favorite' ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleSelectAngle(angle.id)}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium',
                    selectedForAction === angle.id 
                      ? 'bg-success text-white' 
                      : 'bg-primary text-white'
                  )}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Selection */}
      {selectedForAction && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-center gap-4 shadow-xl z-50">
          <div className="flex items-center gap-2">
            <Check size={20} className="text-success" />
            <div>
              <p className="text-white font-medium">Angle {selectedForAction} Selected</p>
              <p className="text-sm text-[#94A3B8]">Confirm to proceed with workflow</p>
            </div>
          </div>
          <button
            onClick={confirmSelection}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white font-medium hover:bg-success/90"
          >
            Confirm & Continue
            <ChevronDown size={18} className="rotate-[-90deg]" />
          </button>
        </div>
      )}
    </div>
  );
}

function getStatusIndicator(status: string) {
  switch (status) {
    case 'selected':
      return <div className="w-3 h-3 rounded-full bg-success" />;
    case 'favorite':
      return <div className="w-3 h-3 rounded-full bg-warning" />;
    case 'rejected':
      return <div className="w-3 h-3 rounded-full bg-error" />;
    default:
      return <div className="w-3 h-3 rounded-full bg-[#334155]" />;
  }
}
