'use client';

import { useState, useEffect } from 'react';
import { Flag, Check, X, Trash2, Eye, ChevronRight, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface ReportedContentItem {
  id: number;
  contentType: string;
  contentId: number;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  reporter: {
    id: number;
    username: string;
    minecraftUsername: string | null;
    avatar: string | null;
    role: string;
  };
  content: any;
}

function getUserAvatar(minecraftUsername?: string | null, avatar?: string | null, size: number = 64): string {
  if (minecraftUsername) {
    return `https://mc-heads.net/head/${minecraftUsername}/${size}`;
  }
  if (avatar) {
    return avatar;
  }
  return `https://mc-heads.net/head/steve/${size}`;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Selected report for review
  const [selectedReport, setSelectedReport] = useState<ReportedContentItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [deleteContent, setDeleteContent] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?page=${page}&limit=${limit}&status=${statusFilter}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data = await response.json();
      setReports(data.reports);
      setTotalPages(data.pagination.totalPages);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, limit, statusFilter]);

  const handleUpdateReport = async (reportId: number, status: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes || undefined,
          deleteContent: deleteContent && status === 'actioned',
        }),
      });

      if (!response.ok) throw new Error('Failed to update report');

      toast.success(`Report ${status}`);
      setSelectedReport(null);
      setReviewNotes('');
      setDeleteContent(false);
      fetchReports();
    } catch (error) {
      toast.error('Failed to update report');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'reviewed': return 'bg-blue-500/20 text-blue-400';
      case 'dismissed': return 'bg-slate-500/20 text-slate-400';
      case 'actioned': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'social_post': return 'Social Post';
      case 'forum_post': return 'Forum Post';
      case 'forum_reply': return 'Forum Reply';
      case 'group_post': return 'Group Post';
      case 'group_comment': return 'Group Comment';
      case 'social_comment': return 'Social Comment';
      default: return type;
    }
  };

  const validLimits = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reported Content</h1>
          <p className="text-slate-400">Review and manage reported posts, comments, and replies</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
            <option value="actioned">Actioned</option>
            <option value="all">All Reports</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
              <div className="flex gap-6">
                {/* Reporter Info */}
                <div className="flex items-start gap-3 w-48">
                  <img
                    src={getUserAvatar(report.reporter.minecraftUsername, report.reporter.avatar, 40)}
                    alt={report.reporter.username}
                    className="w-10 h-10 rounded-lg pixelated"
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">{report.reporter.username}</div>
                    <div className="text-xs text-slate-500">Reporter</div>
                  </div>
                </div>

                {/* Report Details */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(report.status)}`}>
                      {report.status.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
                      {getContentTypeLabel(report.contentType)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-1">Reason:</div>
                    <div className="text-white">{report.reason}</div>
                  </div>

                  {report.description && (
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-1">Description:</div>
                      <div className="text-slate-400 text-sm">{report.description}</div>
                    </div>
                  )}

                  {/* Reported Content Preview */}
                  {report.content && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium text-slate-300">Reported Content</span>
                      </div>
                      <div className="space-y-2">
                        {report.content.author && (
                          <div className="text-sm text-slate-400">
                            Author: <span className="text-white">{report.content.author.username}</span>
                          </div>
                        )}
                        {report.content.title && (
                          <div className="text-sm font-medium text-white">{report.content.title}</div>
                        )}
                        <div className="text-sm text-slate-300 line-clamp-3">
                          {report.content.content}
                        </div>
                        {report.content.imageUrl && (
                          <img
                            src={report.content.imageUrl}
                            alt="Content"
                            className="rounded-lg max-h-32 object-cover"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {report.reviewNotes && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-400 mb-1">Review Notes:</div>
                      <div className="text-sm text-slate-300">{report.reviewNotes}</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && reports.length > 0 && (
        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Reports per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {validLimits.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Review Report</h3>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setReviewNotes('');
                  setDeleteContent(false);
                }}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Content Preview */}
              {selectedReport.content && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-sm font-medium text-slate-300 mb-3">Reported Content:</div>
                  <div className="space-y-2">
                    {selectedReport.content.author && (
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={getUserAvatar(selectedReport.content.author.minecraftUsername, null, 40)}
                          alt={selectedReport.content.author.username}
                          className="w-10 h-10 rounded-lg pixelated"
                        />
                        <span className="font-medium text-white">{selectedReport.content.author.username}</span>
                      </div>
                    )}
                    {selectedReport.content.title && (
                      <div className="font-bold text-white text-lg">{selectedReport.content.title}</div>
                    )}
                    <div className="text-slate-300 whitespace-pre-wrap">{selectedReport.content.content}</div>
                    {selectedReport.content.imageUrl && (
                      <img
                        src={selectedReport.content.imageUrl}
                        alt="Content"
                        className="rounded-lg max-w-full"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Review Notes (optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Add notes about your decision..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              {/* Delete Content Option */}
              <label className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteContent}
                  onChange={(e) => setDeleteContent(e.target.checked)}
                  className="w-5 h-5 text-red-500 focus:ring-red-500"
                />
                <div>
                  <div className="text-sm font-medium text-red-400">Delete reported content</div>
                  <div className="text-xs text-red-400/70">This action cannot be undone</div>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateReport(selectedReport.id, 'dismissed')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Dismiss
                </button>
                <button
                  onClick={() => handleUpdateReport(selectedReport.id, 'reviewed')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark Reviewed
                </button>
                <button
                  onClick={() => handleUpdateReport(selectedReport.id, 'actioned')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Take Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
