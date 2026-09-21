'use client';

/**
 * app/security/incidents/[id]/page.js
 *
 * Security Incident Investigation Workspace for SecretShield.
 * Includes status lifecycle controls, sanitized notes editor, and exposure cluster links.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  ExternalLink,
  Layers,
  FileCode,
  RefreshCw,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteWarning, setNoteWarning] = useState(null);
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (id) fetchIncident();
  }, [id]);

  async function fetchIncident() {
    try {
      setLoading(true);
      const res = await fetch(`/api/security/incidents/${id}`);
      const json = await res.json();
      if (json.success) {
        setIncident(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await fetch(`/api/security/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchIncident();
    } catch {
      // fallback
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setSubmittingNote(true);
      const res = await fetch(`/api/security/incidents/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNote('');
        setNoteWarning(data.warning || null);
        await fetchIncident();
      }
    } catch {
      // fallback
    } finally {
      setSubmittingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 text-center space-y-4">
        <p className="text-muted-foreground">Incident not found.</p>
        <Link href="/security/incidents">
          <Button variant="outline" size="sm">Back to Incidents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/security/incidents" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Incidents
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{incident.title}</h1>
                <Badge variant="outline" className="font-mono text-xs">{incident.severity}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Incident ID: {incident.id} • Created: {new Date(incident.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Lifecycle Status Transition */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lifecycle Status:</span>
              <select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-md text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="OPEN">OPEN</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="REMEDIATION">REMEDIATION</option>
                <option value="VERIFYING">VERIFYING</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Exposure Clusters & Findings */}
        <div className="space-y-6 lg:col-span-2">
          {/* Linked Exposure Clusters */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Linked Exposure Clusters ({incident.relatedFingerprints?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!incident.relatedFingerprints || incident.relatedFingerprints.length === 0 ? (
                <p className="text-xs text-muted-foreground">No specific fingerprints linked to this incident.</p>
              ) : (
                <div className="space-y-2">
                  {incident.relatedFingerprints.map((fp) => (
                    <div key={fp} className="p-3 rounded bg-muted/30 border border-border/60 flex items-center justify-between">
                      <div className="font-mono text-xs space-y-0.5">
                        <span className="text-muted-foreground block text-[10px]">Masked Fingerprint</span>
                        <span className="text-foreground">{fp.slice(0, 24)}...</span>
                      </div>
                      <Link href={`/exposure/${fp}`}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          Cluster View
                          <ExternalLink className="w-3 h-3 text-primary" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline of Associated Events */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Incident Timeline & Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!incident.events || incident.events.length === 0 ? (
                <p className="text-xs text-muted-foreground">No standalone timeline events recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {incident.events.map((ev) => (
                    <div key={ev.id} className="p-2.5 rounded bg-muted/40 border border-border/60 text-xs flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-semibold">{ev.eventType}:</span>{' '}
                        <span className="text-muted-foreground">{ev.summary}</span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sanitized Investigation Notes */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-4 border-b border-border/60">
              <CardTitle className="text-base font-semibold">
                Investigation Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Pre-save sanitizer notice */}
              <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-[11px] text-muted-foreground flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Notes are sanitized. Secrets or credentials accidentally pasted are automatically masked.</span>
              </div>

              {noteWarning && (
                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  {noteWarning}
                </div>
              )}

              {/* Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={3}
                  placeholder="Record investigation findings or remediation status notes..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-2.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button type="submit" disabled={submittingNote || !newNote.trim()} size="sm" className="w-full gap-2">
                  <Send className="w-3.5 h-3.5" />
                  {submittingNote ? 'Saving...' : 'Add Note'}
                </Button>
              </form>

              {/* Existing Notes Feed */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                {!incident.notes || incident.notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No notes recorded yet.</p>
                ) : (
                  incident.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded bg-muted/30 border border-border/60 text-xs space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{note.authorName}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-muted-foreground">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
