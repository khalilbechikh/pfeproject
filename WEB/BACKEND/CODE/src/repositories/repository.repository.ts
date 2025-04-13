import {Prisma,PrismaClient,repository} from '@prisma/client';
import {inject, injectable} from 'inversify';
// this is the schema for the repository table
/*model repository {
  id                Int                  @id @default(autoincrement()) @db.Integer
  name              String               @db.VarChar(255)
  owner_user_id     Int                  @db.Integer
  description       String?              @db.Text
  is_private        Boolean?             @default(false) @db.Boolean
  parent_id         Int?                 @db.Integer      // Field to track the parent repository if this is a fork
  forked_at         DateTime?            @db.Timestamp(6) // When this repository was forked (if it is a fork)
  created_at        DateTime             @default(now()) @db.Timestamp(6)
  updated_at        DateTime             @default(now()) @updatedAt @db.Timestamp(6)

  // Foreign key relationships
  owner             users                @relation(fields: [owner_user_id], references: [id], onDelete: Cascade)
  parent            repository?          @relation("ForkRelation", fields: [parent_id], references: [id], onDelete: SetNull)
  forks             repository[]         @relation("ForkRelation")

  // Relations to other models
  access            repository_access[]
  issue             issue[]
  pull_request      pull_request[]
}
*/

@injectable()
export  class RepositoryRepository {
 private repoRelationMap: { [tableName: string]: keyof Prisma.repositoryInclude } = {
    'repository_accesses': 'access',
    'issues': 'issue',
    'pull_requests': 'pull_request',
 }
 constructor(@inject(PrismaClient) private prisma: PrismaClient) {
    console.log("repository repo called");
    this.prisma= prisma;
 }
    async findById(
        id: number,
        tableNamesToInclude?: string[]): Promise<repository | null> {
     try {
         let includeRelations: Prisma.repositoryInclude | undefined = undefined;
            if (tableNamesToInclude && tableNamesToInclude.length > 0) {
                includeRelations = {};
                for (const tableName of tableNamesToInclude) {
                    const relationName = this.repoRelationMap[tableName];
                    if (relationName) {
                        includeRelations[relationName] = true;
                    } else {
                        console.warn(`Warning: Table name "${tableName}" is not a valid relation for repository model and will be ignored.`);
                    }
                }
            }
            const repository = await this.prisma.repository.findUnique({
                where: { id: id },
                include: includeRelations,
            });
            return repository; // No need for casting
     }

        catch (error){
         console.error(error);
         throw error;
        }






    }
    async createRepository(data: Prisma.repositoryCreateInput): Promise<repository> {
        try {
            const newRepository = await this.prisma.repository.create({
                data,
            });
            return newRepository;
        } catch (error) {
            console.error('Error in RepositoryRepository.createRepository:', error);
            throw error;
        }
    }
    async updateRepository(id :number ,data: Prisma.repositoryUpdateInput): Promise<repository> {
        try {
            const updatedRepository = await this.prisma.repository.update({
                where: { id:id },
                data,
            });
            return updatedRepository;
        } catch (error) {
            console.error('Error in RepositoryRepository.updateRepository:', error);
            throw error;
        }

    }
    async deleteRepository(id: number): Promise<repository> {
        try {
            const deletedRepository = await this.prisma.repository.delete({
                where: { id: id },
            });
            return deletedRepository;
        } catch (error) {
            console.error('Error in RepositoryRepository.deleteRepository:', error);
            throw error;
        }
    }
}
