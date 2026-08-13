import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminQuestionAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import {
  HelpCircle, Search, CheckCircle, XCircle, Trash2, Loader2, AlertCircle,
  MessageSquare, MessageCircle, X,
} from 'lucide-react';

export const AdminQuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [answeredFilter, setAnsweredFilter] = useState('');

  // Answer modal
  const [answerModalQuestion, setAnswerModalQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (answeredFilter) params.answered = answeredFilter;

      const res = await adminQuestionAPI.getAdminQuestions(params);
      if (res.success) {
        setQuestions(res.data.questions || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, answeredFilter]);

  useEffect(() => {
    fetchQuestions(1);
  }, [fetchQuestions]);

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerModalQuestion || !answerText.trim()) return;
    setSubmittingAnswer(true);
    try {
      const res = await adminQuestionAPI.answerQuestion(answerModalQuestion._id, answerText.trim());
      if (res.success) {
        setAnswerModalQuestion(null);
        setAnswerText('');
        fetchQuestions(pagination.page);
      }
    } catch (err) {
      alert(err.message || 'Failed to post answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleModerateStatus = async (questionId, status) => {
    try {
      const res = await adminQuestionAPI.moderateQuestionStatus(questionId, status);
      if (res.success) fetchQuestions(pagination.page);
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleDelete = async (questionId) => {
    if (!confirm('Delete this question and its answers permanently?')) return;
    try {
      await adminQuestionAPI.deleteQuestion(questionId);
      fetchQuestions(pagination.page);
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Product Questions & Answers Portal</h1>
        <p className="text-sm text-slate-500 mt-1">Review customer product questions and submit official Ayoola Signature responses</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          onClick={() => setAnsweredFilter(answeredFilter === 'false' ? '' : 'false')}
          className={`text-xs px-3 py-2 rounded-xl font-bold border transition-all ${
            answeredFilter === 'false' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Unanswered Only
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          No questions found matching criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const productImg = q.product?.images?.[0];
            return (
              <div key={q._id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border shrink-0">
                    {productImg ? (
                      <img src={getImageUrl(productImg)} alt={q.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {q.product?.name || 'Product'}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        q.isAnswered ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {q.isAnswered ? '✓ Answered' : 'Unanswered'}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900">"{q.question}"</h4>
                    <p className="text-xs text-slate-400">
                      Asked by <strong className="text-slate-700">{q.user?.firstName} {q.user?.lastName} ({q.user?.email})</strong> on {new Date(q.createdAt).toLocaleDateString()}
                    </p>

                    {/* Answers List */}
                    {q.answers && q.answers.length > 0 && (
                      <div className="space-y-1.5 pt-2 pl-3 border-l-2 border-amber-400">
                        {q.answers.map((ans) => (
                          <div key={ans._id} className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-0.5 border border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <strong className="text-slate-900">{ans.user?.firstName} {ans.user?.lastName}</strong>
                              {ans.isAdmin && (
                                <span className="bg-amber-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded">
                                  Ayoola Signature Official
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700">{ans.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => { setAnswerModalQuestion(q); setAnswerText(''); }}
                      className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Answer
                    </button>
                    {q.status !== 'rejected' && (
                      <button
                        onClick={() => handleModerateStatus(q._id, 'rejected')}
                        className="bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-rose-100"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-all text-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Answer Modal */}
      {answerModalQuestion && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setAnswerModalQuestion(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-600" /> Answer Customer Question
              </h3>
              <button onClick={() => setAnswerModalQuestion(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
              <p className="font-bold text-amber-900">Question:</p>
              <p className="text-slate-800 font-medium">{answerModalQuestion.question}</p>
            </div>

            <form onSubmit={handleAnswerSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Official Response *</label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={4}
                  required
                  placeholder="e.g. Yes, all Ayoola Signature timepiece collections come complete with a 2-year international warranty..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setAnswerModalQuestion(null)} className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={submittingAnswer} className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold disabled:opacity-50">
                  {submittingAnswer ? 'Posting...' : 'Submit Official Answer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionsPage;
