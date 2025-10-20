import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { apiCall } from '../../config/api';
import Notification from '../Common/Notification';
import { useAuth } from '../../context/AuthContext';

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
  parentId?: string;
  replies?: Comment[];
  entityType: 'task' | 'service' | 'ticket';
  entityId: string;
  entityTitle?: string;
}

interface CommentsListProps {
  onNavigate?: (module: string) => void;
}

const CommentsList: React.FC<CommentsListProps> = ({ onNavigate }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'task' | 'service' | 'ticket'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'popular'>('recent');
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState({
    entityType: 'task' as 'task' | 'service' | 'ticket',
    entityId: '',
    content: ''
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [filterType, sortBy]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      // For now, we'll fetch comments from all entities
      // In a real implementation, you might want to fetch all comments across entities
      const response = await apiCall('/api/comments', 'GET', {
        entityType: filterType === 'all' ? undefined : filterType,
        entityId: 'all' // Special case to get all comments
      });

      if (response.success) {
        setComments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në marrjen e komenteve',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.content.trim() || !newComment.entityId.trim()) {
      setNotification({
        type: 'error',
        message: 'Ju lutemi plotësoni të gjitha fushat',
        isVisible: true
      });
      return;
    }

    try {
      const response = await apiCall('/api/comments', 'POST', {
        entityType: newComment.entityType,
        entityId: newComment.entityId,
        content: newComment.content.trim()
      });

      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Komenti u shtua me sukses',
          isVisible: true
        });
        setNewComment({ entityType: 'task', entityId: '', content: '' });
        setShowAddComment(false);
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në shtimin e komentit',
        isVisible: true
      });
    }
  };

  const handleVote = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await apiCall(`/api/comments/${commentId}/vote`, 'POST', {
        voteType
      });

      if (response.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.author.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || comment.entityType === filterType;
    return matchesSearch && matchesFilter;
  });

  const sortedComments = [...filteredComments].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'popular':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      default:
        return 0;
    }
  });

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'task': return '📋';
      case 'service': return '🔧';
      case 'ticket': return '🎫';
      default: return '📄';
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'service': return 'bg-green-100 text-green-800';
      case 'ticket': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Komentet</h1>
            <p className="text-gray-600">Menaxho të gjitha komentet në sistem</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddComment(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Shto Koment
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Kërko komente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter by Type */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
            >
              <option value="all">Të gjitha</option>
              <option value="task">Taskat</option>
              <option value="service">Servisi</option>
              <option value="ticket">Tiketat</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
            >
              <option value="recent">Më të fundit</option>
              <option value="oldest">Më të vjetrit</option>
              <option value="popular">Më popullorët</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Add Comment Modal */}
      {showAddComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Shto Koment të Ri</h2>
                <button
                  onClick={() => setShowAddComment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Entity Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lloji i Entitetit
                  </label>
                  <select
                    value={newComment.entityType}
                    onChange={(e) => setNewComment({ ...newComment, entityType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="task">Task</option>
                    <option value="service">Service</option>
                    <option value="ticket">Ticket</option>
                  </select>
                </div>

                {/* Entity ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID e Entitetit
                  </label>
                  <input
                    type="text"
                    placeholder="Shkruaj ID-në e entitetit..."
                    value={newComment.entityId}
                    onChange={(e) => setNewComment({ ...newComment, entityId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Përmbajtja
                  </label>
                  <textarea
                    placeholder="Shkruaj komentin tënd..."
                    value={newComment.content}
                    onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddComment(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Anulo
                </button>
                <button
                  onClick={handleAddComment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Shto Koment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Duke ngarkuar komentet...</p>
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk ka komente</h3>
            <p className="text-gray-500 mb-4">Bëhu i pari që shton koment!</p>
            <button
              onClick={() => setShowAddComment(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Shto Koment të Parë
            </button>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{comment.author.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getEntityColor(comment.entityType)}`}>
                        {getEntityIcon(comment.entityType)} {comment.entityType.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Comment Content */}
              <div className="mb-4">
                <p className="text-gray-800 leading-relaxed">{comment.content}</p>
              </div>

              {/* Comment Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleVote(comment.id, 'upvote')}
                    className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{comment.upvotes}</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote(comment.id, 'downvote')}
                    className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm">{comment.downvotes}</span>
                  </button>

                  <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                    <Reply className="w-4 h-4" />
                    <span className="text-sm">Përgjigju</span>
                  </button>
                </div>

                <div className="text-sm text-gray-500">
                  ID: {comment.entityId}
                </div>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-6 border-l-2 border-gray-100">
                  <div className="space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{reply.author.name}</span>
                          <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notification */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
    </div>
  );
};

export default CommentsList;
