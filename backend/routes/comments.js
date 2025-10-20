const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Get comments for a specific entity
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { entityType, entityId } = req.query;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: 'entityType dhe entityId janë të detyrueshme'
      });
    }

    // Validate entityType
    const validEntityTypes = ['task', 'service', 'ticket'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'entityType duhet të jetë: task, service, ose ticket'
      });
    }

    console.log(`Fetching comments for ${entityType}:${entityId}`);

    // Get comments with user information
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        upvotes,
        downvotes,
        parent_id,
        user_id,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({
        success: false,
        message: 'Gabim në marrjen e komenteve'
      });
    }

    // Transform comments to include replies
    const transformedComments = transformCommentsWithReplies(comments || []);

    res.json({
      success: true,
      data: transformedComments
    });

  } catch (error) {
    console.error('Error in comments GET:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim i brendshëm në server'
    });
  }
});

// Create a new comment
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { entityType, entityId, content, parentId } = req.body;
    const userId = req.user.id;

    if (!entityType || !entityId || !content) {
      return res.status(400).json({
        success: false,
        message: 'entityType, entityId dhe content janë të detyrueshme'
      });
    }

    // Validate entityType
    const validEntityTypes = ['task', 'service', 'ticket'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'entityType duhet të jetë: task, service, ose ticket'
      });
    }

    // Validate that the entity exists
    const entityExists = await validateEntityExists(entityType, entityId);
    if (!entityExists) {
      return res.status(404).json({
        success: false,
        message: `${entityType} nuk u gjet`
      });
    }

    console.log(`Creating comment for ${entityType}:${entityId} by user:${userId}`);

    // Insert comment
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        content: content.trim(),
        user_id: userId,
        parent_id: parentId || null,
        upvotes: 0,
        downvotes: 0
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        upvotes,
        downvotes,
        parent_id,
        user_id,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return res.status(500).json({
        success: false,
        message: 'Gabim në krijimin e komentit'
      });
    }

    // Transform comment
    const transformedComment = transformComment(newComment);

    res.status(201).json({
      success: true,
      data: transformedComment,
      message: 'Komenti u krijua me sukses'
    });

  } catch (error) {
    console.error('Error in comments POST:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim i brendshëm në server'
    });
  }
});

// Vote on a comment
router.post('/:commentId/vote', authenticateUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'voteType duhet të jetë: upvote ose downvote'
      });
    }

    console.log(`User ${userId} voting ${voteType} on comment ${commentId}`);

    // Check if user already voted on this comment
    const { data: existingVote, error: voteError } = await supabase
      .from('comment_votes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('Error checking existing vote:', voteError);
      return res.status(500).json({
        success: false,
        message: 'Gabim në kontrollimin e votimit'
      });
    }

    if (existingVote) {
      // User already voted, update the vote
      if (existingVote.vote_type === voteType) {
        // Same vote type, remove the vote
        await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);

        // Update comment vote counts
        const voteChange = voteType === 'upvote' ? -1 : 1;
        await updateCommentVoteCount(commentId, voteType, voteChange);
      } else {
        // Different vote type, update the vote
        await supabase
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('comment_id', commentId)
          .eq('user_id', userId);

        // Update comment vote counts
        const oldVoteChange = existingVote.vote_type === 'upvote' ? -1 : 1;
        const newVoteChange = voteType === 'upvote' ? 1 : -1;
        await updateCommentVoteCount(commentId, existingVote.vote_type, oldVoteChange);
        await updateCommentVoteCount(commentId, voteType, newVoteChange);
      }
    } else {
      // New vote
      await supabase
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: userId,
          vote_type: voteType
        });

      // Update comment vote counts
      const voteChange = voteType === 'upvote' ? 1 : -1;
      await updateCommentVoteCount(commentId, voteType, voteChange);
    }

    res.json({
      success: true,
      message: 'Votimi u përditësua me sukses'
    });

  } catch (error) {
    console.error('Error in comment vote:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim i brendshëm në server'
    });
  }
});

// Update a comment
router.put('/:commentId', authenticateUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'content është i detyrueshëm'
      });
    }

    // Check if user owns the comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('Error fetching comment:', fetchError);
      return res.status(404).json({
        success: false,
        message: 'Komenti nuk u gjet'
      });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Nuk keni leje për të modifikuar këtë koment'
      });
    }

    // Update comment
    const { data: updatedComment, error } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        upvotes,
        downvotes,
        parent_id,
        user_id,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return res.status(500).json({
        success: false,
        message: 'Gabim në përditësimin e komentit'
      });
    }

    const transformedComment = transformComment(updatedComment);

    res.json({
      success: true,
      data: transformedComment,
      message: 'Komenti u përditësua me sukses'
    });

  } catch (error) {
    console.error('Error in comment PUT:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim i brendshëm në server'
    });
  }
});

// Delete a comment
router.delete('/:commentId', authenticateUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check if user owns the comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('Error fetching comment:', fetchError);
      return res.status(404).json({
        success: false,
        message: 'Komenti nuk u gjet'
      });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Nuk keni leje për të fshirë këtë koment'
      });
    }

    // Delete comment (cascade will handle votes and replies)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({
        success: false,
        message: 'Gabim në fshirjen e komentit'
      });
    }

    res.json({
      success: true,
      message: 'Komenti u fshi me sukses'
    });

  } catch (error) {
    console.error('Error in comment DELETE:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim i brendshëm në server'
    });
  }
});

// Helper functions
function transformComment(comment) {
  return {
    id: comment.id,
    content: comment.content,
    author: {
      id: comment.users.id,
      name: comment.users.name,
      avatar: comment.users.avatar_url
    },
    createdAt: comment.created_at,
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0,
    parentId: comment.parent_id,
    replies: []
  };
}

function transformCommentsWithReplies(comments) {
  const commentMap = new Map();
  const rootComments = [];

  // First pass: create comment objects
  comments.forEach(comment => {
    const transformedComment = transformComment(comment);
    commentMap.set(comment.id, transformedComment);
  });

  // Second pass: organize replies
  comments.forEach(comment => {
    const transformedComment = commentMap.get(comment.id);
    
    if (comment.parent_id) {
      // This is a reply
      const parentComment = commentMap.get(comment.parent_id);
      if (parentComment) {
        parentComment.replies = parentComment.replies || [];
        parentComment.replies.push(transformedComment);
      }
    } else {
      // This is a root comment
      rootComments.push(transformedComment);
    }
  });

  return rootComments;
}

async function validateEntityExists(entityType, entityId) {
  try {
    let tableName;
    switch (entityType) {
      case 'task':
        tableName = 'tasks';
        break;
      case 'service':
        tableName = 'services';
        break;
      case 'ticket':
        tableName = 'tickets';
        break;
      default:
        return false;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', entityId)
      .single();

    return !error && data;
  } catch (error) {
    console.error('Error validating entity:', error);
    return false;
  }
}

async function updateCommentVoteCount(commentId, voteType, change) {
  try {
    const updateField = voteType === 'upvote' ? 'upvotes' : 'downvotes';
    
    // Get current count
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select(updateField)
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('Error fetching comment for vote update:', fetchError);
      return;
    }

    const newCount = Math.max(0, (comment[updateField] || 0) + change);

    // Update count
    await supabase
      .from('comments')
      .update({ [updateField]: newCount })
      .eq('id', commentId);

  } catch (error) {
    console.error('Error updating comment vote count:', error);
  }
}

module.exports = router;
