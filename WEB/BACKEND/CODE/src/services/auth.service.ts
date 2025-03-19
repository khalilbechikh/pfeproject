import {Prisma, users} from '@prisma/client';
import {UserRepository} from "@/repositories/user.repository";
import {inject, injectable} from 'inversify';
import  {ApiResponse , ResponseStatus} from "@/DTO/apiResponse.DTO";
import * as bycrypt from 'bcrypt';


@injectable()
export class AuthService {
    private userRepository: UserRepository;

    constructor(@inject('UserRepository') userRepository: UserRepository) {
        this.userRepository = userRepository;
    }
    async hashPassword(password: string): Promise<string> {
        return await  bycrypt.hash(password, 10);
    }
    public async comparePassword(password : string , hashedPassword :string) :Promise<boolean> {
        return await bycrypt.compare(password,hashedPassword);
    }
     async signUp(userData: Prisma.usersCreateInput): Promise<ApiResponse<users>> {
        try {
            const  existedUser = await this.userRepository.prisma.users.findUnique({
                where: {
                    email: userData.email
                }
            })
            if (existedUser) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'User already exists',
                    error: 'User already exists'
                }
            }
            const hashedPassword =  await this.hashPassword(userData.password_hash)
            const user = await this.userRepository.prisma.users.create({
                data:{ ...userData, password_hash: hashedPassword}
            });
            return {
                status: ResponseStatus.SUCCESS,
                message: 'User created successfully',
                data: user
            };
        }
        catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to create user',
                error: '${error}'
            };
        }

    }
    async  signIn ( email : string , password : string): Promise<ApiResponse<users>> {
        try {
            const user = await this.userRepository.prisma.users.findUnique({
                where: {
                    email: email
                }
            })
            if (!user) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'User not found',
                    error: 'User not found'
                }
            }
            const isPasswordValid = await this.comparePassword(password, user.password_hash);
            if (!isPasswordValid) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid password',
                    error: 'Invalid password'
                }
            }
            return {
                status: ResponseStatus.SUCCESS,
                message: 'User logged in successfully',
                data: user
            };
        }
        catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to login user',
                error: '${error}'
            };
        }
    }
}


