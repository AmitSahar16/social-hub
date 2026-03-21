import mongoose from 'mongoose';
import { IPost } from '../types';
import { embeddingService } from '../services/embeddingService';

const postSchema = new mongoose.Schema<IPost>(
  {
    message: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    user: {
      type: String,
      required: true,
      ref: 'User',
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      required: false,
      select: false,
    },
  },
  { timestamps: true }
);


postSchema.index({ createdAt: -1 });


postSchema.index({ user: 1, createdAt: -1 });


postSchema.index({ user: 1 });

postSchema.pre('save', async function (next) {
  if (this.isModified('message') && this.message) {
    try {
      console.log('Generating embedding for post...');
      this.embedding = await embeddingService.generateEmbedding(this.message);
      console.log('Embedding generated successfully');
    } catch (error) {
      console.error('Failed to generate embedding:', error);
    }
  }
  next();
});

export default mongoose.model<IPost>('Post', postSchema, 'posts');
