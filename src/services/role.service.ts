import { Role, IRole } from '../models';

export class RoleService {
    public async createRole(role: IRole): Promise<IRole> {
        try {
            const newRole = await Role.create(role);
            return newRole;
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'MongoServerError') {
                    // @ts-ignore
                    if (error.code === 11000) {
                        throw new Error('Role already exists');
                    }
                }

                throw error;
            }
            throw new Error('Failed to create role');
        }
    }

    public async getRoleById(roleId: string): Promise<IRole | null> {
        try {
            const role = await Role.findById(roleId);
            return role;
        } catch (error) {
            throw new Error('Failed to fetch role');
        }
    }

    public async updateRole(roleId: string, updatedRole: IRole): Promise<IRole | null> {
        try {
            const role = await Role.findByIdAndUpdate(roleId, updatedRole, { new: true });
            return role;
        } catch (error) {
            throw new Error('Failed to update role');
        }
    }

    public async deleteRole(roleId: string): Promise<void> {
        try {
            const role = await Role.findByIdAndDelete(roleId);

            if (!role) {
                throw new Error('Role not found');
            }

            return;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete role');
        }
    }

    public async getRoles(): Promise<IRole[]> {
        try {
            const roles = await Role.find();
            return roles;
        } catch (error) {
            throw new Error('Failed to fetch roles');
        }
    }
}

