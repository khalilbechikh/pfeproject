import 'reflect-metadata';
import { Container } from 'inversify';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { getPrismaClient } from '../prisma/prisma-client';
import { PrismaClient } from '@prisma/client';
import { AuthService } from "../services/auth.service";
import { AuthenticationController } from "../controllers/authentication.controller";
import { RepositoryRepository } from "../repositories/repository.repository";
import { RepositoryService } from "../services/repository.service";
import { RepositoryController } from "../controllers/repository.controller";
import { RepositoryAccessRepository } from "../repositories/repository_access.repository";
import { RepositoryAccessService } from "../services/repository_access.service";
import { RepositoryAccessController } from "../controllers/repository_access.controller";
import { IssueRepository } from "../repositories/issue.repository";
//import { GitCrud } from "../git/git.crud";
import { TYPES } from './types';
import { IssueService } from "../services/issue.service";
// Import new IssueComment components
import { IssueCommentRepository } from '../repositories/issue_comment.repository';
import { IssueCommentService } from '../services/issue_comment.service';
import { IssueCommentController } from '../controllers/issue_comment.controller';
// Import PullRequestRepository
import { PullRequestRepository } from '../repositories/pullRequest.repository';
// Import PullRequestService
import { PullRequestService } from '../services/pullRequest.services';
// Import PullRequestController
import { PullRequestController } from '../controllers/pullRequest.controller';
// Import Folder Preview components
import { FolderPreviewService } from '../services/folder.preview.service';
import { FolderPreviewController } from '../controllers/folder.preview.controller';
// Import GitService
//import { GitService } from '../services/git.service';
// Import IssueController
import { IssueController } from '../controllers/issue.controller';
// Import TwoFactorAuthController
import { TwoFactorAuthController } from '../controllers/2fa';

// Create a single InversifyJS Container
const container = new Container();
console.log("Inversify Container Instance:", container);

// Bind database client
container.bind<PrismaClient>(TYPES.PrismaClient)
    .toDynamicValue(() => getPrismaClient())
    .inSingletonScope();

// Bind repositories
container.bind<UserRepository>(UserRepository)
    .toSelf()
    .inSingletonScope();

container.bind<RepositoryRepository>(TYPES.RepositoryRepository)
    .to(RepositoryRepository)
    .inSingletonScope();

container.bind<RepositoryAccessRepository>(TYPES.RepositoryAccessRepository)
    .to(RepositoryAccessRepository)
    .inSingletonScope();

container.bind<IssueRepository>(TYPES.IssueRepository)
    .to(IssueRepository)
    .inSingletonScope();

// Bind PullRequestRepository
container.bind<PullRequestRepository>(TYPES.PullRequestRepository)
    .to(PullRequestRepository)
    .inSingletonScope();

// Bind IssueCommentRepository
container.bind<IssueCommentRepository>(TYPES.IssueCommentRepository)
    .to(IssueCommentRepository)
    .inSingletonScope();

// Bind services
container.bind<UserService>(UserService)
    .toSelf()
    .inSingletonScope();

container.bind<AuthService>(AuthService)
    .toSelf()
    .inSingletonScope();

container.bind<RepositoryService>(RepositoryService)
    .toSelf()
    .inSingletonScope();

container.bind<RepositoryAccessService>(RepositoryAccessService)
    .toSelf()
    .inSingletonScope();

container.bind<IssueService>(IssueService)
    .toSelf()
    .inSingletonScope();

// Bind PullRequestService
container.bind<PullRequestService>(TYPES.PullRequestService)
    .to(PullRequestService)
    .inSingletonScope();

// Bind IssueCommentService
container.bind<IssueCommentService>(TYPES.IssueCommentService)
    .to(IssueCommentService)
    .inSingletonScope();

// Bind FolderPreviewService
container.bind<FolderPreviewService>(TYPES.FolderPreviewService)
    .to(FolderPreviewService)
    .inSingletonScope();

/*
container.bind<GitCrud>(GitCrud)
    .toSelf()
    .inSingletonScope();
*/
// Bind GitService
/*
container.bind<GitService>(TYPES.GitService)
    .to(GitService)
    .inSingletonScope();
*/

// Bind controllers
container.bind<UserController>(UserController)
    .toSelf()
    .inRequestScope();

// FIX: Use TYPES.AuthenticationController instead of AuthenticationController class
container.bind<AuthenticationController>(TYPES.AuthenticationController)
    .to(AuthenticationController)
    .inSingletonScope();

container.bind<RepositoryController>(RepositoryController)
    .toSelf()
    .inSingletonScope();

container.bind<RepositoryAccessController>(TYPES.RepositoryAccessController)
    .to(RepositoryAccessController)
    .inSingletonScope();


// Bind PullRequestController
container.bind<PullRequestController>(TYPES.PullRequestController)
    .to(PullRequestController)
    .inSingletonScope(); // Or .inRequestScope() if preferred

// Bind IssueCommentController
container.bind<IssueCommentController>(TYPES.IssueCommentController)
    .to(IssueCommentController)
    .inSingletonScope(); // Or .inRequestScope() depending on preference

// Bind IssueController
container.bind<IssueController>(IssueController)
    .toSelf()
    .inSingletonScope();

// Bind FolderPreviewController
container.bind<FolderPreviewController>(TYPES.FolderPreviewController)
    .to(FolderPreviewController)
    .inRequestScope();

// Bind TwoFactorAuthController
container.bind<TwoFactorAuthController>(TYPES.TwoFactorAuthController)
    .to(TwoFactorAuthController)
    .inSingletonScope();

export default container;