import mongoose from 'mongoose';
import { IComment } from '../types';

const commentSchema = new mongoose.Schema<IComment>(
  {
    text: {
      type: String,
      required: true,
    },
    post: {
      type: String,
      required: true,
      ref: 'Post',
    },
    user: {
      type: String,
      required: true,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IComment>('Comment', commentSchema, 'comments');
