import { Types } from 'mongoose';
import { User, IUser, IRole, Role } from '../models';

export class UserService {

    public async getUsers(): Promise<IUser[]> {
        try {
            const users = await User.find().populate('role');
            return users;
        } catch (error) {
            throw new Error('Failed to fetch users');
        }
    }

    public async createUser(user: IUser): Promise<IUser> {
        try {

            if (!user.role) {
                const role = await Role.findOne({ name: 'User' });
                if (role) {
                    user.role = role;
                }
            }

            const newUser = await User.create(user);
            return newUser;
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'MongoServerError') {
                    // @ts-ignore
                    if (error.code === 11000) {
                        throw new Error('User already exists');
                    }
                }
            }

            throw new Error('Failed to create user');
        }
    }

    public async getUserById(userId: string): Promise<IUser | null> {
        return await User.findById(userId).populate('role');
    }

    public async updateUser(userId: string, updatedUser: IUser): Promise<IUser | null> {
        try {
            const user = await User.findByIdAndUpdate(userId, updatedUser, { new: true }).populate('role');
            return user;
        } catch (error) {
            throw new Error('Failed to update user');
        }
    }

    public async deleteUser(userId: string): Promise<void> {
        try {
            const deletedUser = await User.findByIdAndDelete(userId);

            if (!deletedUser) {
                throw new Error('User not found');
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }

            throw new Error('Failed to delete user');
        }
    }

    public async upsertUser(user: IUser): Promise<IUser | null> {
        try {
            const options = { upsert: true, new: true };
            const updatedUser = await User.findOneAndUpdate({ _id: user._id }, user, options);
            return updatedUser;
        } catch (error) {
            throw new Error('Failed to upsert user');
        }
    }

    // Other table operations
    public async updateUserRole(userId: string, role: IRole | Types.ObjectId): Promise<IUser | null> {
        try {
            let roleObj: IRole | null = null;
            // search for role by name if role is a string
            if (typeof role === 'string') {
                roleObj = await Role.findOne({ name: role });
            } else if (role._id) {
                roleObj = await Role.findById(role._id);
            }

            if (!roleObj) {
                throw new Error('Role not found');
            }

            const updatedUser = await User.findByIdAndUpdate(userId, { role: roleObj }, { new: true }).populate('role');
            return updatedUser;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update user role');
        }
    }
}