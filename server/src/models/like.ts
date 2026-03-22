import mongoose from 'mongoose';
import { ILike } from '../types';

const likeSchema = new mongoose.Schema<ILike>(
  {
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

likeSchema.index({ post: 1, user: 1 }, { unique: true });

export default mongoose.model<ILike>('Like', likeSchema, 'likes');
