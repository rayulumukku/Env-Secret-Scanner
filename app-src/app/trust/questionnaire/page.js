'use client';

/**
 * app/trust/questionnaire/page.js
 *
 * Security Questionnaire & Customer Vendor Assessment Center for SecretShield.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Save,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SecurityQuestionnairePage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [editAnswer, setEditAnswer] = useState('YES');
  const [editExplanation, setEditExplanation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [selectedCategory]);

  async function fetchQuestions() {
    try {
      setLoading(true);
      const url = selectedCategory !== 'ALL'
        ? `/api/trust/questionnaire?category=${selectedCategory}`
        : '/api/trust/questionnaire';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setQuestions(json.data || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAnswer(id) {
    try {
      setSaving(true);
      await fetch('/api/trust/questionnaire', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          answer: editAnswer,
          explanation: editExplanation,
        }),
      });
      setEditingId(null);
      await fetchQuestions();
    } catch {
      // fallback
    } finally {
      setSaving(false);
    }
  }

  function startEdit(q) {
    setEditingId(q.id);
    setEditAnswer(q.answer);
    setEditExplanation(q.explanation || '');
  }

  function getAnswerBadge(ans) {
    switch (ans) {
      case 'YES':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">YES</Badge>;
      case 'PARTIALLY':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">PARTIALLY</Badge>;
      case 'NO':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">NO</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/trust" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Trust Center
                </Link>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Questionnaire & Vendor Assessment</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Evidence-backed responses to customer security questionnaires across 12 standard vendor assessment categories.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchQuestions} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'AUTHENTICATION', 'ACCESS_CONTROL', 'DATA_PROTECTION', 'ENCRYPTION', 'LOGGING', 'INCIDENT_RESPONSE', 'RETENTION', 'AI_DATA_PROCESSING'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-card border border-border/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Questions Feed */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <CardTitle className="text-base font-semibold">
              Assessment Questionnaire ({questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/40">
            {questions.map((q) => {
              const isEditing = editingId === q.id;
              return (
                <div key={q.id} className="p-5 space-y-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{q.title}</span>
                        {getAnswerBadge(q.answer)}
                        <Badge variant="outline" className="text-[10px] font-mono">{q.category}</Badge>
                      </div>
                      <p className="text-xs text-foreground font-medium">{q.question}</p>
                    </div>

                    {!isEditing && (
                      <Button onClick={() => startEdit(q)} variant="outline" size="sm" className="shrink-0">
                        Edit Response
                      </Button>
                    )}
                  </div>

                  {/* Editing Mode */}
                  {isEditing ? (
                    <div className="p-3 rounded bg-muted/30 border border-border/60 space-y-3 text-xs">
                      <div className="flex gap-4 items-center">
                        <label className="font-medium text-foreground">Answer:</label>
                        <select
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="px-2.5 py-1 bg-background border border-border rounded text-xs text-foreground"
                        >
                          <option value="YES">YES</option>
                          <option value="PARTIALLY">PARTIALLY</option>
                          <option value="NO">NO</option>
                          <option value="NOT_APPLICABLE">NOT_APPLICABLE</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium text-foreground">Detailed Technical Explanation:</label>
                        <textarea
                          rows={3}
                          value={editExplanation}
                          onChange={(e) => setEditExplanation(e.target.value)}
                          className="w-full p-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button onClick={() => handleSaveAnswer(q.id)} disabled={saving} size="sm" className="gap-1.5">
                          <Save className="w-3.5 h-3.5" />
                          {saving ? 'Saving...' : 'Save Response'}
                        </Button>
                        <Button onClick={() => setEditingId(null)} variant="ghost" size="sm">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded space-y-1">
                      <span className="font-semibold text-foreground block">Verified Explanation:</span>
                      <p>{q.explanation || 'No explanation provided.'}</p>
                      <div className="text-[10px] text-muted-foreground pt-1 flex gap-4">
                        <span>Owner: {q.owner}</span>
                        <span>Last Reviewed: {new Date(q.lastReviewedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
