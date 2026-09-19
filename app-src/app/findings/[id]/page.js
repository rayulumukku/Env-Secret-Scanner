'use client';

/**
 * app/findings/[id]/page.js
 *
 * Comprehensive Single Finding Remediation Page.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  RefreshCw, 
  ArrowLeft, 
  CheckSquare, 
  MessageSquare, 
  Activity, 
  GitBranch, 
  FileCode, 
  Send, 
  Lock, 
  KeyRound, 
  Layers, 
  HelpCircle,
  FolderGit2
} from 'lucide-react';

export default function FindingDetailPage() {
  const { id } = useParams();
  const [finding, setFinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('remediation');

  async function fetchFinding() {
    setLoading(true);
    try {
      const res = await fetch(`/api/findings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFinding(data.finding);
        setNoteText(data.finding.notes || '');
      }
    } catch (err) {
      console.error('Failed to load finding details:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFinding();
  }, [id]);

  async function handleStatusChange(newStatus) {
    try {
      const res = await fetch(`/api/findings/${id}/remediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Status updated to ${newStatus}` });
        fetchFinding();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleChecklistToggle(taskId, completed) {
    if (!finding?.checklist) return;
    const updated = finding.checklist.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        };
      }
      return t;
    });

    try {
      const res = await fetch(`/api/findings/${id}/remediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updated }),
      });
      if (res.ok) {
        fetchFinding();
      }
    } catch (err) {
      console.error('Failed to update checklist:', err);
    }
  }

  async function handleSaveNotes() {
    setSavingNote(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/findings/${id}/remediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Notes saved successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save notes.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingNote(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/findings/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentText('');
        fetchFinding();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit comment.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleRescan() {
    setRescanning(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/findings/${id}/rescan`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: data.isDetected ? 'warning' : 'success',
          text: data.message,
        });
        fetchFinding();
      } else {
        setMessage({ type: 'error', text: data.error || 'Rescan failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRescanning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-white">Finding Not Found</h1>
          <p className="text-xs text-gray-400 mt-1">The requested security finding does not exist or has been removed.</p>
          <Link href="/remediation" className="mt-4 inline-block px-4 py-2 bg-indigo-600 rounded-lg text-xs font-semibold">
            Back to Remediation Center
          </Link>
        </div>
      </div>
    );
  }

  const isResolved = finding.status === 'RESOLVED';
  const slaStatus = finding.sla?.status || 'ON_TRACK';

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
          <Link href="/remediation" className="hover:text-gray-200 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Remediation Center
          </Link>
          <span>/</span>
          <span className="text-gray-300 font-mono">{finding.id}</span>
        </div>

        {/* Top Header Card */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded border ${
                  finding.severity === 'CRITICAL'
                    ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                    : finding.severity === 'HIGH'
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                    : 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                }`}>
                  {finding.severity}
                </span>

                <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-900 border border-gray-800 rounded text-gray-300">
                  Confidence: {finding.confidence || 50}%
                </span>

                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded border ${
                  slaStatus === 'OVERDUE'
                    ? 'bg-red-950/60 text-red-400 border-red-800/60'
                    : slaStatus === 'DUE_SOON'
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                }`}>
                  SLA: {slaStatus.replace('_', ' ')}
                </span>
              </div>

              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                {finding.type || finding.ruleId}
              </h1>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">Masked Secret Preview:</span>
                <code className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs font-mono text-indigo-300">
                  {finding.maskedValue}
                </code>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={finding.status || 'UNREVIEWED'}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-semibold text-white focus:outline-none"
              >
                <option value="UNREVIEWED">UNREVIEWED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="AWAITING_ROTATION">AWAITING_ROTATION</option>
                <option value="AWAITING_RESCAN">AWAITING_RESCAN</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                <option value="IGNORED">IGNORED</option>
              </select>

              <button
                onClick={handleRescan}
                disabled={rescanning}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? 'animate-spin' : ''}`} />
                {rescanning ? 'Scanning...' : 'Rescan Repository'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-lg text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
              : message.type === 'warning'
              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
              : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
          }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-8 border-b border-gray-800 flex items-center gap-6 text-xs font-semibold">
          {[
            { id: 'remediation', label: 'Remediation Guide & Checklist' },
            { id: 'context', label: 'Source Context & Location' },
            { id: 'history', label: 'Git Exposure & Related' },
            { id: 'discussion', label: `Team Comments (${finding.comments?.length || 0})` },
            { id: 'timeline', label: 'Activity Timeline' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Remediation Guide & Checklist */}
        {activeTab === 'remediation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Checklist */}
              <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-400" />
                  Remediation Checklist
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Complete each step in sequence to securely resolve this exposure.
                </p>

                <div className="mt-5 space-y-3">
                  {finding.checklist?.map(task => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-lg border flex items-start gap-3 transition-colors ${
                        task.completed
                          ? 'bg-gray-900/40 border-gray-800/80'
                          : 'bg-gray-900/80 border-gray-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => handleChecklistToggle(task.id, e.target.checked)}
                        className="mt-0.5 rounded border-gray-700 bg-gray-900"
                      />
                      <div className="flex-1 text-xs">
                        <div className={`font-semibold ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {task.label}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Developer Notes with Secret Validation */}
              <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Remediation Notes
                  </h3>
                  <span className="text-[11px] text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Do not paste credentials into notes.
                  </span>
                </div>

                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record rotation verification notes, ticket links, or details..."
                  rows={4}
                  className="w-full p-3 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNote}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {savingNote ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Provider Guide Sidecard */}
            <div className="space-y-6">
              <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  Provider Guidance
                </h3>

                <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg text-xs">
                  <div className="text-gray-400">Provider:</div>
                  <div className="font-bold text-white text-sm">{finding.guide?.providerName}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-300">Best Practices:</div>
                  <ol className="list-decimal list-inside text-xs text-gray-400 space-y-1.5">
                    {finding.guide?.steps?.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="pt-3 border-t border-gray-800 space-y-2">
                  {finding.guide?.consoleUrl && (
                    <a
                      href={finding.guide.consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      Open Provider Console <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {finding.guide?.documentationUrl && (
                    <a
                      href={finding.guide.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      Official Documentation <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Source Context & Location */}
        {activeTab === 'context' && (
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 mt-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              Source Coordinates &amp; Detection Metadata
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block">Repository:</span>
                <span className="font-semibold text-white font-mono">{finding.repository?.fullName || 'local'}</span>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block">File &amp; Line:</span>
                <span className="font-semibold text-white font-mono">{finding.file}:{finding.line}</span>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block">Commit SHA:</span>
                <span className="font-semibold text-indigo-300 font-mono">{finding.commitHash?.slice(0, 10) || 'HEAD'}</span>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block">Rule ID:</span>
                <span className="font-semibold text-white font-mono">{finding.ruleId}</span>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block">Committed By:</span>
                <span className="font-semibold text-white">{finding.author || 'Unknown'}</span>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block">First Detected:</span>
                <span className="font-semibold text-white">{new Date(finding.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <span className="text-xs font-bold text-gray-400 block mb-1">SHA-256 Fingerprint:</span>
              <code className="text-xs font-mono text-gray-300 break-all">{finding.fingerprint}</code>
            </div>
          </div>
        )}

        {/* TAB 3: Git Exposure & Related Occurrences */}
        {activeTab === 'history' && (
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 mt-6 space-y-6">
            <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Fact-Based Invariant:</strong> Removing a credential from the current file does not prove that the credential was revoked at the provider. Always confirm revocation in the provider's dashboard.
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400 mb-3">
                Related Occurrences Sharing Fingerprint ({finding.relatedOccurrences?.length || 0})
              </h3>

              {finding.relatedOccurrences?.length === 0 ? (
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-500 text-center">
                  No other occurrences detected with this fingerprint.
                </div>
              ) : (
                <div className="divide-y divide-gray-800 bg-gray-900 border border-gray-800 rounded-lg">
                  {finding.relatedOccurrences.map(rel => (
                    <div key={rel.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-indigo-300 font-semibold">{rel.file}:{rel.line}</span>
                        <span className="text-gray-500 ml-2">in {rel.repository?.name || 'repo'}</span>
                      </div>
                      <Link href={`/findings/${rel.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                        View Occurrence →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Team Discussion Thread */}
        {activeTab === 'discussion' && (
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Team Comments &amp; Discussion
              </h2>
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Credentials in comments are blocked automatically.
              </span>
            </div>

            <div className="space-y-3">
              {finding.comments?.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-lg">
                  No comments yet. Start a discussion with your team.
                </div>
              ) : (
                finding.comments.map(c => (
                  <div key={c.id} className="p-3.5 bg-gray-900 border border-gray-800 rounded-lg text-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1.5">
                      <span className="font-semibold text-white">{c.userName || c.userEmail}</span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(c.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Box */}
            <form onSubmit={handleAddComment} className="pt-4 border-t border-gray-800">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment or mention team members..."
                rows={3}
                className="w-full p-3 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: Activity Timeline */}
        {activeTab === 'timeline' && (
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 mt-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-indigo-400" />
              Exposure &amp; Remediation Event Timeline
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
              {finding.timeline?.map(evt => (
                <div key={evt.id} className="relative flex items-start gap-4">
                  <div className="absolute -left-6 mt-1 p-1 bg-[#161b22] border border-gray-800 rounded-full text-indigo-400">
                    <Activity className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 bg-gray-900/60 border border-gray-800 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{evt.title}</span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(evt.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-gray-400 mt-1">{evt.description}</p>
                    )}
                    <div className="text-[11px] text-gray-500 mt-1">
                      Actor: <strong className="text-gray-400">{evt.actor}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
