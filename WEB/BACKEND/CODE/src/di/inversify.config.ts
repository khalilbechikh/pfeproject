import 'reflect-metadata'; // (1) Import reflect-metadata
import { Container } from 'inversify'; // (2) Import Container from InversifyJS
import { UserRepository } from '../repositories/user.repository'; // (3) Import UserRepository
import { getPrismaClient } from '../prisma/prisma-client'; // (4) Import getPrismaClient
import { PrismaClient } from '@prisma/client'; // (5) Import PrismaClient type

const container = new Container(); // (6) Create a new InversifyJS Container

// (7) Bind PrismaClient to the identifier 'PrismaClient'
container.bind<PrismaClient>('PrismaClient')
    .toDynamicValue(() => getPrismaClient()) // (7.1) Use toDynamicValue for singleton
    .inSingletonScope(); // (7.2) Configure as singleton scope

// (8) Bind UserRepository to the identifier UserRepository (the class itself)
container.bind<UserRepository>(UserRepository)
    .toSelf() // (8.1) Use toSelf to bind to the class itself
    .inSingletonScope(); // (8.2) Configure as singleton scope

export default container; // (9) Export the InversifyJS Container instance