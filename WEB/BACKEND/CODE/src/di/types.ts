const TYPES = {
    PrismaClient: Symbol.for('PrismaClient'),
    UserRepository: Symbol.for('UserRepository'),
    UserService: Symbol.for('UserService'),
    UserController: Symbol.for('UserController'),
    AuthService: Symbol.for('AuthService'),
    AuthenticationController: Symbol.for('AuthenticationController'),
    RepositoryRepository: Symbol.for('RepositoryRepository'),
    PullRequestRepository: Symbol.for('PullRequestRepository'), // Added this line
    RepositoryService: Symbol.for('RepositoryService'),
    RepositoryController: Symbol.for('RepositoryController'),
    RepositoryAccessRepository: Symbol.for('RepositoryAccessRepository'),
    RepositoryAccessService: Symbol.for('RepositoryAccessService'),
    RepositoryAccessController: Symbol.for('RepositoryAccessController'),
    IssueRepository: Symbol.for('IssueRepository'),
    IssueService: Symbol.for('IssueService'),
    IssueController: Symbol.for('IssueController'),
    GitCrud: Symbol.for('GitCrud'),
    // Add new types for IssueComment
    IssueCommentRepository: Symbol.for('IssueCommentRepository'),
    IssueCommentService: Symbol.for('IssueCommentService'),
    IssueCommentController: Symbol.for('IssueCommentController'),
    GitService: Symbol.for('GitService'), // Add this line

    // Add new types for Folder Preview
    FolderPreviewService: Symbol.for('FolderPreviewService'),
    FolderPreviewController: Symbol.for('FolderPreviewController'),

    // Add new types for Pull Request
    PullRequestService: Symbol.for('PullRequestService'),
    PullRequestController: Symbol.for('PullRequestController'),

    // Add new symbol for TwoFactorAuthController
    TwoFactorAuthController: Symbol.for('TwoFactorAuthController'),
};

export { TYPES };