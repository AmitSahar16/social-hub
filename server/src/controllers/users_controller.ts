import { Response } from 'express';
import User from '../models/user';
import { IAuthRequest } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';

class UsersController {
  getAllUsers = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const users = await User.find().select('-password -refreshTokens');
    res.json(users);
  });

  getUserById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = await User.findById(req.params.id).select('-password -refreshTokens');

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json(user);
  });

  getMyProfile = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = await User.findById(req.user._id).select('-password -refreshTokens');

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json(user);
  });

  updateMyProfile = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { username, avatar } = req.body;
    const updateData: any = {};

    if (username) {
      updateData.username = username;
    }

    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    } else if (avatar) {
      updateData.profileImage = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json(user);
  });

  deleteUser = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({ message: 'User deleted successfully' });
  });
}

export default new UsersController();