import 'reflect-metadata'; // (1) Import reflect-metadata
import { Container } from 'inversify'; // (2) Import Container from InversifyJS
import { UserRepository } from '../repositories/user.repository'; // (3) Import UserRepository
import { UserService } from '../services/user.service'; // (4) Import UserService
import { UserController } from '../controllers/user.controller'; // (5) Import UserController
import { getPrismaClient } from '../prisma/prisma-client'; // (6) Import getPrismaClient
import { PrismaClient } from '@prisma/client'; // (7) Import PrismaClient type
import {AuthService} from "../services/auth.service";
import {AuthenticationController} from "../controllers/authentication.controller";

const container = new Container(); // (8) Create a new InversifyJS Container
console.log("Inversify Container Instance:", container);
// (9) Bind PrismaClient to the identifier 'PrismaClient'
container.bind<PrismaClient>('PrismaClient')
    .toDynamicValue(() => getPrismaClient()) // (9.1) Use toDynamicValue for singleton
    .inSingletonScope(); // (9.2) Configure as singleton scope
container.bind(AuthService).toSelf().inSingletonScope();
container.bind(AuthenticationController).toSelf().inSingletonScope();
// (10) Bind UserRepository to the identifier UserRepository (the class itself)
container.bind<UserRepository>(UserRepository)
    .toSelf() // (10.1) Use toSelf to bind to the class itself
    .inSingletonScope(); // (10.2) Configure as singleton scope

// (11) Bind UserService to the identifier UserService (the class itself)
container.bind<UserService>(UserService)
    .toSelf() // (11.1) Use toSelf to bind to the class itself
    .inSingletonScope(); // (11.2) Configure as singleton scope

// (12) Bind UserController to the identifier UserController (the class itself)
container.bind<UserController>(UserController)
    .toSelf() // (12.1) Use toSelf to bind to the class itself
    .inRequestScope(); // (12.2) Use request scope for controllers

export default container; // (13) Export the InversifyJS Container instance