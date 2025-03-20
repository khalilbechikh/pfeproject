import  {Router} from 'express';
import {UserController} from "../controllers/user.controller";
import container from "../di/inversify.config";
import  {AuthenticationController} from "../controllers/authentication.controller";


export   const  authenticationRoutes = (): Router => {
    const router = Router();
    const authenticationController =container.get<AuthenticationController>(AuthenticationController);

    router.post('/signup', authenticationController.signUp);
    router.post('/signin', authenticationController.signIn);

    return router;
}