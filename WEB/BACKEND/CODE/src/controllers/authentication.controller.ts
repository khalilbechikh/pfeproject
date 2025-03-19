import  {Request,Response} from "express";
import  {injectable,inject} from "inversify";
import {UserService,CreateUserDto,UpdateUserDto} from "../services/user.service";




@injectable()
export class AuthenticationController {
    constructor(@inject(UserService) private userService:UserService) {}
    singUp= async (req : Request, res : Response): Promise<void> => {
        try {
            const
        }

    }
}