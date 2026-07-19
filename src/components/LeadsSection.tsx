/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lead } from '../types';
import { Users, Mail, Phone, Calendar, MessageSquare, Search, Filter, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useConfirm } from './ConfirmDialog';

interface LeadsSectionProps {
  leads: Lead[];
  onUpdateLead?: () => void;
}

export default function LeadsSection({ leads, onUpdateLead }: LeadsSectionProps) {
  const { confirm } = useConfirm();
  const [filterQuery, setFilterQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, new, standard, status_new, status_progress, etc.
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  const getIsNew = (timestampStr: string) => {
    try {
      const ms = new Date(timestampStr).getTime();
      return (Date.now() - ms) < 86400000; // less than 24 hours
    } catch {
      return false;
    }
  };

  const handleUpdateStatus = (leadId: string, newStatus: 'New' | 'In Progress' | 'Contacted' | 'Closed') => {
    confirm({
      title: 'Update Lead Status',
      message: `Are you sure you want to change this customer lead status to "${newStatus}"? This updates the customer file in Firestore.`,
      type: 'update',
      onConfirm: async () => {
        setUpdatingLeadId(leadId);
        try {
          const leadRef = doc(db, 'chatbot_leads', leadId);
          await updateDoc(leadRef, { status: newStatus });
          if (onUpdateLead) {
            onUpdateLead();
          }
        } catch (err) {
          console.error("Error updating lead status:", err);
          alert("Failed to update status. Please try again.");
        } finally {
          setUpdatingLeadId(null);
        }
      }
    });
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      (lead.name || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
      (lead.phone || '').toLowerCase().includes(filterQuery.toLowerCase());

    const isNew = getIsNew(lead.timestamp);
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'new' && isNew) ||
      (typeFilter === 'standard' && !isNew) ||
      (typeFilter === 'status_new' && (lead.status === 'New' || !lead.status)) ||
      (typeFilter === 'status_progress' && lead.status === 'In Progress') ||
      (typeFilter === 'status_contacted' && lead.status === 'Contacted') ||
      (typeFilter === 'status_closed' && lead.status === 'Closed');

    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Chatbot Customer Leads
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Browse leads, view status, and manage inquiries collected through your custom web chatbot assistant.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-950/40 text-xs font-black text-violet-600 dark:text-violet-400 rounded-full border border-violet-100/50 dark:border-violet-900/40">
            Total Collected: {leads.length}
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search leads by name, email, or phone..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm outline-none focus:bg-white focus:border-violet-500 transition-all text-slate-850 dark:text-white"
          />
        </div>

        <div className="relative shrink-0">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <Filter className="w-4 h-4" />
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-violet-500 text-slate-850 dark:text-white cursor-pointer"
          >
            <option value="all">All Leads</option>
            <option value="new">New Inquiries (&lt; 24h)</option>
            <option value="status_new">Status: New</option>
            <option value="status_progress">Status: In Progress</option>
            <option value="status_contacted">Status: Contacted</option>
            <option value="status_closed">Status: Closed</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto border border-slate-100 dark:border-slate-750 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-750 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Contact Details</th>
              <th className="px-6 py-4">Acquisition Channel</th>
              <th className="px-6 py-4">Submission Time</th>
              <th className="px-6 py-4">Lead Status Option</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-750">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  No matching chatbot leads discovered.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isNew = getIsNew(lead.timestamp);
                let formattedDate = 'Recent';
                try {
                  formattedDate = new Date(lead.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                } catch (e) {
                  // Fallback
                }

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{lead.name || 'Anonymous Contact'}</span>
                        {isNew && (
                          <span className="inline-block px-2 py-0.5 bg-violet-600 text-[9px] font-extrabold uppercase text-white rounded-full leading-none tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email / Phone */}
                    <td className="px-6 py-4 space-y-1">
                      {lead.email ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-350">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                      ) : null}
                      {lead.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-450 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lead.phone}</span>
                        </div>
                      ) : null}
                      {!lead.email && !lead.phone && (
                        <span className="text-slate-300 italic text-xs">No direct contacts provided</span>
                      )}
                    </td>

                    {/* Acquisition notes */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Instant web-bot conversation</span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>

                    {/* Status Dropdown Option */}
                    <td className="px-6 py-4">
                      {updatingLeadId === lead.id ? (
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <select
                          value={lead.status || 'New'}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer shadow-sm transition-all ${
                            lead.status === 'Closed'
                              ? 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                              : lead.status === 'Contacted'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                              : lead.status === 'In Progress'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40'
                          }`}
                        >
                          <option value="New">🔵 New Lead</option>
                          <option value="In Progress">🟡 In Progress</option>
                          <option value="Contacted">🟢 Contacted</option>
                          <option value="Closed">⚪ Closed</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
