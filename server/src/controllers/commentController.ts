import { Request, Response } from 'express';
import prisma from '../db';
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from '../services/activityLogger';


export const getDocumentComments = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { documentId },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { authorName, authorAvatar, authorColor, text, selectedText, rangeStart, rangeEnd } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        id: uuidv4(),
        documentId,
        authorName: authorName || 'Anonymous',
        authorAvatar: authorAvatar || null,
        authorColor: authorColor || '#3b82f6',
        text: text.trim(),
        selectedText: selectedText || null,
        rangeStart: rangeStart !== undefined ? Number(rangeStart) : null,
        rangeEnd: rangeEnd !== undefined ? Number(rangeEnd) : null,
      },
      include: {
        replies: true,
      },
    });

    logActivity({
      action: 'COMMENT_CREATED',
      entityType: 'comment',
      entityId: comment.id,
      details: `Comment added by ${comment.authorName}: "${comment.text.slice(0, 60)}"`,
      userName: comment.authorName,
      metadata: { documentId, selectedText: comment.selectedText },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { text, resolved } = req.body;

    const dataToUpdate: any = {};
    if (text !== undefined) dataToUpdate.text = text;
    if (resolved !== undefined) dataToUpdate.resolved = resolved;

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: dataToUpdate,
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (resolved !== undefined) {
      logActivity({
        action: resolved ? 'COMMENT_RESOLVED' : 'COMMENT_REOPENED',
        entityType: 'comment',
        entityId: commentId,
        details: `Comment ${commentId} marked as ${resolved ? 'resolved' : 'open'}`,
        metadata: { commentId, resolved },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

export const addCommentReply = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { authorName, authorAvatar, authorColor, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const reply = await prisma.commentReply.create({
      data: {
        id: uuidv4(),
        commentId,
        authorName: authorName || 'Anonymous',
        authorAvatar: authorAvatar || null,
        authorColor: authorColor || '#3b82f6',
        text: text.trim(),
      },
    });

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    await prisma.comment.delete({
      where: { id: commentId },
    });
    res.json({ message: 'Comment deleted successfully', id: commentId });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
