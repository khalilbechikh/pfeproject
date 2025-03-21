import { Prisma, PrismaClient, users } from '@prisma/client'; // Import the actual 'users' type
import { injectable, inject } from 'inversify';

@injectable()
export class UserRepository {
     prisma: PrismaClient;

    private userRelationMap: { [tableName: string]: keyof Prisma.usersInclude } = {
        'repositories': 'repository',
        'repository_accesses': 'repository_access',
        'issues': 'issue',
        'pull_requests': 'pull_request',
        'issue_comments': 'issue_comment',
        'pull_request_comments': 'pull_request_comment',
    };

    constructor(@inject('PrismaClient') prisma: PrismaClient) {
        console.log("user repo called");
        this.prisma = prisma;
    }

    async findById(
        id: number,
        tableNamesToInclude?: string[]
    ): Promise<users | null> { // Changed from Prisma.users to users
        try {
            let includeRelations: Prisma.usersInclude | undefined = undefined;

            if (tableNamesToInclude && tableNamesToInclude.length > 0) {
                includeRelations = {};
                for (const tableName of tableNamesToInclude) {
                    const relationName = this.userRelationMap[tableName];
                    if (relationName) {
                        includeRelations[relationName] = true;
                    } else {
                        console.warn(`Warning: Table name "${tableName}" is not a valid relation for users model and will be ignored.`);
                    }
                }
            }

            const user = await this.prisma.users.findUnique({
                where: { id: id },
                include: includeRelations,
            });
            return user; // No need for casting
        } catch (error) {
            console.error('Error in UserRepository.findById:', error);
            throw error;
        }
    }

    async createUser(data: Prisma.usersCreateInput): Promise<users> { // Changed from Prisma.users to users
        try {
            const newUser = await this.prisma.users.create({
                data,
            });
            return newUser;
        } catch (error) {
            console.error('Error in UserRepository.createUser:', error);
            throw error;
        }
    }

    async updateUser(
        id: number,
        data: Prisma.usersUpdateInput
    ): Promise<users | null> { // Changed from Prisma.users to users
        try {
            const updatedUser = await this.prisma.users.update({
                where: { id: id },
                data,
            });
            return updatedUser;
        } catch (error) {
            console.error('Error in UserRepository.updateUser:', error);
            return null;
        }
    }

    async deleteUser(id: number): Promise<users | null> { // Changed from Prisma.users to users
        try {
            const deletedUser = await this.prisma.users.delete({
                where: { id: id },
            });
            return deletedUser;
        } catch (error) {
            console.error('Error in UserRepository.deleteUser:', error);
            return null;
        }
    }
}