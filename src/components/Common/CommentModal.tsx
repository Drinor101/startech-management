import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, User } from 'lucide-react';
import { apiCall } from '../../config/api';
import Notification from './Notification';

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
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'task' | 'service' | 'ticket';
  entityId: string;
  entityTitle: string;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });

  // Fetch comments when modal opens or when entity changes
  useEffect(() => {
    if (isOpen) {
      console.log(`Fetching comments for ${entityType}:${entityId}`);
      fetchComments();
    }
  }, [isOpen, entityType, entityId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      console.log(`Fetching comments for ${entityType}:${entityId}`);
      const response = await apiCall(`/api/comments?entityType=${entityType}&entityId=${entityId}`, {
        method: 'GET'
      });

      if (response.success) {
        console.log(`Found ${response.data?.length || 0} comments`);
        setComments(response.data || []);
      } else {
        console.log('No comments found or error:', response.message);
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setNotification({
        isVisible: true,
        message: 'Gabim në ngarkimin e komenteve',
        type: 'error'
      });
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await apiCall('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          entityId,
          content: newComment.trim()
        })
      });

      if (response.success) {
        // Refresh comments to get the latest data from server
        await fetchComments();
        setNewComment('');
        setNotification({
          isVisible: true,
          message: 'Komenti u shtua me sukses',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setNotification({
        isVisible: true,
        message: 'Gabim në shtimin e komentit',
        type: 'error'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Komentet</h2>
                <p className="text-sm text-gray-600">
                  {entityType.toUpperCase()}: {entityTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                Duke ngarkuar komentet...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nuk ka komente ende. Bëhu i pari që komenton!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <img
                        src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.name}&background=random`}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-800">{comment.author.name}</span>
                          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex space-x-3">
              <div className="flex-grow">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Shkruaj komentin këtu..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Shto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
    </>
  );
};

export default CommentModal;
