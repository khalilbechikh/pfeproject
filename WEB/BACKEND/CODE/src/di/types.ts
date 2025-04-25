const TYPES = {
    PrismaClient: Symbol.for('PrismaClient'),
    UserRepository: Symbol.for('UserRepository'),
    UserService: Symbol.for('UserService'),
    UserController: Symbol.for('UserController'),
    AuthService: Symbol.for('AuthService'),
    AuthenticationController: Symbol.for('AuthenticationController'),
    RepositoryRepository: Symbol.for('RepositoryRepository'),
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
};

export { TYPES };