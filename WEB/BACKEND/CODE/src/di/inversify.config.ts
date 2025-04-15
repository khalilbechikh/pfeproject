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
import { GitCrud } from "../git/git.crud";
import { TYPES } from './types';

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

// Bind services
container.bind<UserService>(UserService)
    .toSelf()
    .inSingletonScope();

container.bind<AuthService>(AuthService)
    .toSelf()
    .inSingletonScope();

container.bind<GitCrud>(GitCrud)
    .toSelf()
    .inSingletonScope();

// Bind controllers
container.bind<UserController>(UserController)
    .toSelf()
    .inRequestScope();

container.bind<AuthenticationController>(AuthenticationController)
    .toSelf()
    .inSingletonScope();

export default container;