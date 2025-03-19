import  {Router} from 'express';
import {UserController} from "../controllers/user.controller";
import container from "../di/inversify.config";


export   const  authenticationRoutes = (): Router => {
    const router = Router();
    const userController =container.get<UserController>(UserController);
    router.post("/signup",userController.getUserById);
    return  router;
}