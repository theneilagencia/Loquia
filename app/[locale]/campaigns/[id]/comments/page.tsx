'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { GlowCard } from '@/components/glow';
import { useUserRole } from '@/hooks/useUserRole';
import { ReadOnlyBanner } from '@/components/read-only-banner';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string;
  replies?: Comment[];
}

export default function CommentsPage() {
  const t = useTranslations('comments');
  const tCommon = useTranslations('common');
  const params = useParams();
  const { isReadOnly } = useUserRole();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [params.id]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/campaigns/${params.id}/comments`);
      const data = await res.json();
      
      // Organizar comentários em threads
      const organized = organizeComments(data);
      setComments(organized);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Primeiro, criar mapa de todos os comentários
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Depois, organizar em hierarquia
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/campaigns/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parent_id: replyTo,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      setNewComment('');
      setReplyTo(null);
      await fetchComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-4'}`}>
      <div className="border-l-2 border-gray-700 pl-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
          <span className="text-gray-500 text-xs">
            {new Date(comment.created_at).toLocaleString()}
          </span>
        </div>
        <p className="text-gray-300 mb-2">{comment.content}</p>
        {!isReadOnly && (
          <button
            onClick={() => setReplyTo(comment.id)}
            className="text-blue-400 text-sm hover:underline"
          >
            {t('reply')}
          </button>
        )}
        {replyTo === comment.id && (
          <div className="mt-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('replyPlaceholder')}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {submitting ? tCommon('sending') : t('send')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setNewComment('');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {tCommon('cancel')}
              </button>
            </form>
          </div>
        )}
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-white">{tCommon('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <ReadOnlyBanner />
      <PageHeader title={t('title')} />

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulário de novo comentário */}
      {!isReadOnly && !replyTo && (
        <GlowCard>
          <h3 className="text-lg font-semibold text-white mb-4">
            {t('newComment')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {submitting ? tCommon('sending') : t('postComment')}
            </button>
          </form>
        </GlowCard>
      )}

      {/* Lista de comentários */}
      <GlowCard>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('allComments')} ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <p className="text-gray-500">{t('noComments')}</p>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </GlowCard>
    </div>
  );
}
