import mongoose from 'mongoose';
import { IUser } from '../types';

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  profileImage: {
    type: String,
    required: false,
  },
  refreshTokens: {
    type: [String],
    required: false,
  },
  googleId: {
    type: String,
    required: false,
  },
  createdViaGoogle: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model<IUser>('User', userSchema, 'users');
