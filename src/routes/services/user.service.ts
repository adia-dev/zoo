import { User, IUser } from '../models';

export class UserService {

    public async getUsers(): Promise<IUser[]> {
        try {
            const users = await User.find();
            return users;
        } catch (error) {
            throw new Error('Failed to fetch users');
        }
    }

    public async createUser(user: IUser): Promise<IUser> {
        try {
            const newUser = await User.create(user);
            return newUser;
        } catch (error) {
            console.log(error);
            if (error instanceof Error) {
                if (error.name === 'MongoServerError') {
                    // @ts-ignore
                    console.log(error.code);
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
        return await User.findById(userId);
    }

    public async updateUser(userId: string, updatedUser: IUser): Promise<IUser | null> {
        try {
            const user = await User.findByIdAndUpdate(userId, updatedUser, { new: true });
            return user;
        } catch (error) {
            throw new Error('Failed to update user');
        }
    }

    public async deleteUser(userId: string): Promise<void> {
        try {
            await User.findByIdAndDelete(userId);
        } catch (error) {
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
}