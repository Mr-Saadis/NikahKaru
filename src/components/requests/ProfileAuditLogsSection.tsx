'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  History, 
  Share2, 
  FileText, 
  Edit3, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  Layers
} from 'lucide-react';
import { fetchProfileAuditLogs, type ProfileAuditLogItem } from '@/lib/actions/requests';

interface ProfileAuditLogsSectionProps {
  profileId: string | undefined;
  profileName?: string;
}

function formatTimestamp(isoStr: string): { formatted: string; relative: string } {
  if (!isoStr) return { formatted: 'N/A', relative: '' };
  try {
    const d = new Date(isoStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formatted = `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;

    const diffMs = Date.now() - d.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = '';
    if (diffDays > 30) relative = `${Math.floor(diffDays / 30)}mo ago`;
    else if (diffDays > 0) relative = `${diffDays}d ago`;
    else if (diffHours > 0) relative = `${diffHours}h ago`;
    else if (diffMins > 0) relative = `${diffMins}m ago`;
    else relative = 'just now';

    return { formatted, relative };
  } catch {
    return { formatted: isoStr, relative: '' };
  }
}

function getActionBadge(action: string, entityType: string) {
  switch (action) {
    case 'RELEASE':
      return {
        icon: Share2,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badgeBg: 'bg-emerald-600',
        label: 'Release',
      };
    case 'CREATE':
      return {
        icon: FileText,
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        badgeBg: 'bg-blue-600',
        label: 'Created',
      };
    case 'UPDATE':
      return {
        icon: Edit3,
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        badgeBg: 'bg-amber-600',
        label: 'Updated',
      };
    case 'STATUS_CHANGE':
      return {
        icon: RefreshCw,
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        badgeBg: 'bg-purple-600',
        label: 'Status Change',
      };
    case 'APPROVE':
      return {
        icon: CheckCircle2,
        bg: 'bg-teal-50 text-teal-800 border-teal-200',
        badgeBg: 'bg-teal-600',
        label: 'Approved',
      };
    case 'REJECT':
      return {
        icon: XCircle,
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        badgeBg: 'bg-rose-600',
        label: 'Rejected',
      };
    case 'ASSIGN':
    case 'UNASSIGN':
      return {
        icon: UserCheck,
        bg: 'bg-sky-50 text-sky-800 border-sky-200',
        badgeBg: 'bg-sky-600',
        label: action === 'ASSIGN' ? 'Assigned' : 'Unassigned',
      };
    case 'MATCH_RUN':
      return {
        icon: Layers,
        bg: 'bg-violet-50 text-violet-800 border-violet-200',
        badgeBg: 'bg-violet-600',
        label: 'Match Run',
      };
    default:
      return {
        icon: Activity,
        bg: 'bg-gray-50 text-gray-800 border-gray-200',
        badgeBg: 'bg-gray-600',
        label: action,
      };
  }
}

function getRoleBadge(role: string) {
  const normalized = (role || 'AGENT').toUpperCase();
  if (normalized.includes('ADMIN')) {
    return 'bg-[#ede9fe] text-[#5b21b6] border-[#ddd6fe]';
  }
  if (normalized === 'MANAGER') {
    return 'bg-[#064e3b]/10 text-[#064e3b] border-[#064e3b]/20';
  }
  if (normalized === 'SYSTEM') {
    return 'bg-[#f1f0ea] text-[#555] border-[#e2e1d7]';
  }
  return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]';
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || 'U').slice(0, 2).toUpperCase();
}

export function ProfileAuditLogsSection({ profileId, profileName }: ProfileAuditLogsSectionProps) {
  const [logs, setLogs] = useState<ProfileAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = useCallback(async (silent = false) => {
    if (!profileId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await fetchProfileAuditLogs(profileId);
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching profile audit logs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div 
      className="bg-[#fff] border border-[#eeede6] shadow-[0_6px_18px_rgba(30,30,50,.05)] rounded-[24px] p-[20px] mt-[16px] animate-[sheet-rise_.6s_cubic-bezier(.22,1,.36,1)_both]" 
      style={{ animationDelay: '.28s' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-[14px] border-b border-[#f1f0ea]">
        <div className="flex items-center gap-[10px]">
          <div className="w-[32px] h-[32px] rounded-[10px] bg-[#064e3b]/10 text-[#064e3b] flex items-center justify-center">
            <History size={17} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-[8px]">
              <h4 className="m-0 text-[13px] font-[700] text-[#111] tracking-[-0.1px]">
                Profile Audit Logs
              </h4>
              <span className="text-[11px] font-[600] px-[7px] py-[1.5px] rounded-full bg-[#f1f0ea] text-[#555]">
                {loading ? '...' : `${logs.length} ${logs.length === 1 ? 'event' : 'events'}`}
              </span>
            </div>
            <p className="m-0 text-[11px] text-[#777] font-[500] mt-[1px]">
              Chronological activity history: kb kia, kisny kia, kia kiaa
            </p>
          </div>
        </div>

        <button
          onClick={() => loadLogs(true)}
          disabled={loading || isRefreshing}
          title="Refresh audit logs"
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[#666] hover:text-[#111] hover:bg-[#f5f4ee] transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="pt-[14px]">
        {loading ? (
          <div className="space-y-[12px] py-[8px]">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-[12px] p-[12px] rounded-[16px] bg-[#faf9f6] border border-[#f0ede6]">
                <div className="w-[32px] h-[32px] rounded-full bg-[#e8e6df]" />
                <div className="flex-1 space-y-[8px]">
                  <div className="flex items-center justify-between">
                    <div className="h-[13px] bg-[#e8e6df] rounded-[6px] w-[35%]" />
                    <div className="h-[11px] bg-[#e8e6df] rounded-[6px] w-[20%]" />
                  </div>
                  <div className="h-[12px] bg-[#e8e6df] rounded-[6px] w-[70%]" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-[28px] px-[16px] bg-[#faf9f6] rounded-[18px] border border-dashed border-[#e4e2d8]">
            <div className="w-[38px] h-[38px] mx-auto rounded-full bg-[#f1f0ea] flex items-center justify-center text-[#888] mb-[8px]">
              <ShieldCheck size={20} strokeWidth={1.8} />
            </div>
            <p className="text-[13px] font-[600] text-[#333] m-0">No Audit Events Recorded Yet</p>
            <p className="text-[11px] text-[#777] m-[4px_0_0] max-w-[340px] mx-auto">
              System actions, candidate releases, and status changes for this profile will be tracked and displayed here.
            </p>
          </div>
        ) : (
          <div className="relative pl-[18px] space-y-[12px] before:content-[''] before:absolute before:left-[7px] before:top-[12px] before:bottom-[12px] before:w-[2px] before:bg-[#eeede6]">
            {logs.map((log) => {
              const { formatted, relative } = formatTimestamp(log.created_at);
              const badge = getActionBadge(log.action, log.entity_type);
              const roleBadge = getRoleBadge(log.actor_role);
              const ActionIcon = badge.icon;
              const isExpanded = expandedId === log.id;
              const hasExtraDetails = 
                (log.metadata && Object.keys(log.metadata).length > 0) ||
                (log.new_data && Object.keys(log.new_data).length > 0) ||
                (log.old_data && Object.keys(log.old_data).length > 0);

              return (
                <div 
                  key={log.id} 
                  className="relative group transition-all duration-200"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[18px] top-[14px] w-[16px] h-[16px] rounded-full ${badge.badgeBg} ring-4 ring-[#fff] flex items-center justify-center text-white shadow-sm`}>
                    <div className="w-[5px] h-[5px] rounded-full bg-white" />
                  </div>

                  {/* Card Content */}
                  <div className="bg-[#faf9f6] border border-[#eeede6] hover:border-[#dfded5] transition-all rounded-[18px] p-[13px_15px]">
                    {/* Top Row: Kisny (Who) + Kb (When) */}
                    <div className="flex items-center justify-between gap-[10px] flex-wrap">
                      {/* Kisny (Who) */}
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[24px] h-[24px] rounded-full bg-[#111] text-white text-[10px] font-[700] flex items-center justify-center shrink-0">
                          {getInitials(log.actor_name)}
                        </div>
                        <span className="text-[12.5px] font-[700] text-[#111]">
                          {log.actor_name}
                        </span>
                        <span className={`text-[10px] font-[700] px-[6px] py-[1px] rounded-full border tracking-wide uppercase ${roleBadge}`}>
                          {log.actor_role}
                        </span>
                      </div>

                      {/* Kb (When) */}
                      <div className="flex items-center gap-[6px] text-[#666] text-[11px] font-[500]">
                        <Calendar size={12} className="text-[#888]" />
                        <span>{formatted}</span>
                        {relative && (
                          <span className="px-[6px] py-[1px] rounded-full bg-[#eeede6] text-[#444] text-[10px] font-[600]">
                            {relative}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Kia kiaa (Action title + Action Badge) */}
                    <div className="flex items-center gap-[8px] mt-[8px]">
                      <span className={`inline-flex items-center gap-[4.5px] px-[8px] py-[2px] rounded-[8px] text-[11px] font-[700] border ${badge.bg}`}>
                        <ActionIcon size={12} strokeWidth={2.2} />
                        <span>{badge.label}</span>
                      </span>
                      <h5 className="m-0 text-[13px] font-[600] text-[#222]">
                        {log.title}
                      </h5>
                    </div>

                    {/* Description (Kia kiaa details) */}
                    <p className="text-[12px] text-[#555] font-[450] leading-[1.45] m-[6px_0_0]">
                      {log.description}
                    </p>

                    {/* Expandable Details (if extra metadata/data exists) */}
                    {hasExtraDetails && (
                      <div className="mt-[8px] pt-[7px] border-t border-[#f0eee5]">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="flex items-center gap-[5px] text-[11px] font-[600] text-[#777] hover:text-[#111] transition-colors"
                        >
                          <span>{isExpanded ? 'Hide Event Metadata' : 'View Event Metadata'}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-[8px] p-[10px] rounded-[12px] bg-[#fff] border border-[#e8e6dc] text-[11px] font-mono text-[#333] space-y-[6px] overflow-x-auto">
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div>
                                <span className="font-[700] text-[#064e3b] font-sans block text-[10.5px] mb-[2px]">Metadata:</span>
                                <pre className="m-0 text-[10.5px] whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                              </div>
                            )}
                            {log.new_data && Object.keys(log.new_data).length > 0 && (
                              <div className="pt-[4px] border-t border-[#f5f4ed]">
                                <span className="font-[700] text-[#2563eb] font-sans block text-[10.5px] mb-[2px]">New State:</span>
                                <pre className="m-0 text-[10.5px] whitespace-pre-wrap">{JSON.stringify(log.new_data, null, 2)}</pre>
                              </div>
                            )}
                            {log.old_data && Object.keys(log.old_data).length > 0 && (
                              <div className="pt-[4px] border-t border-[#f5f4ed]">
                                <span className="font-[700] text-[#d97706] font-sans block text-[10.5px] mb-[2px]">Previous State:</span>
                                <pre className="m-0 text-[10.5px] whitespace-pre-wrap">{JSON.stringify(log.old_data, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
