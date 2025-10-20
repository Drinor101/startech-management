import React, { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, ThumbsDown, MoreHorizontal, Reply, Send } from 'lucide-react';
import { apiCall } from '../../config/api';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  upvotes: number;
  downvotes: number;
  replies?: Comment[];
  parentId?: string;
}

interface CommentsSectionProps {
  entityType: 'task' | 'service' | 'ticket';
  entityId: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ entityType, entityId, currentUser }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'popular'>('recent');

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [entityType, entityId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/comments?entityType=${entityType}&entityId=${entityId}`);
      if (response.success) {
        setComments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await apiCall('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          entityId,
          content: newComment.trim(),
          parentId: null
        })
      });

      if (response.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await apiCall('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          entityId,
          content: replyContent.trim(),
          parentId
        })
      });

      if (response.success) {
        setReplyContent('');
        setReplyingTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleVote = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await apiCall(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ voteType })
      });

      if (response.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Tani';
    if (diffInMinutes < 60) return `${diffInMinutes} minuta më parë`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} orë më parë`;
    return `${Math.floor(diffInMinutes / 1440)} ditë më parë`;
  };

  const sortComments = (comments: Comment[]) => {
    switch (sortBy) {
      case 'oldest':
        return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'popular':
        return [...comments].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      default:
        return [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : 'mt-4'} border-b border-gray-100 pb-4`}>
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {comment.author.avatar ? (
            <img src={comment.author.avatar} alt={comment.author.name} className="w-8 h-8 rounded-full" />
          ) : (
            comment.author.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900">{comment.author.name}</span>
            <span className="text-sm text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          
          <p className="text-gray-700 mb-2">{comment.content}</p>
          
          {/* Actions */}
          <div className="flex items-center space-x-4 text-sm">
            <button
              onClick={() => handleVote(comment.id, 'upvote')}
              className="flex items-center space-x-1 text-gray-500 hover:text-green-600"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{comment.upvotes}</span>
            </button>
            
            <button
              onClick={() => handleVote(comment.id, 'downvote')}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-600"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{comment.downvotes}</span>
            </button>
            
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
            >
              <Reply className="w-4 h-4" />
              <span>Përgjigju</span>
            </button>
            
            <button className="text-gray-500 hover:text-gray-700">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3 ml-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Shkruaj përgjigjen..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Add Comment Section */}
      <div className="mb-6">
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Shto koment..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Dërgo</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Komentet</h3>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
              {comments.length}
            </span>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="recent">Më të fundit</option>
            <option value="oldest">Më të vjetër</option>
            <option value="popular">Më të popullarë</option>
          </select>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nuk ka komente ende. Bëhu i pari që komenton!</p>
            </div>
          ) : (
            sortComments(comments).map(comment => renderComment(comment))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;
