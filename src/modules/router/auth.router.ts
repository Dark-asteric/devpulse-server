import { Router } from "express";
import { signUpController } from "../auth/signup/signup.controller";
import { loginController } from "../auth/login/login.controller";

const router = Router();

router.post('/signup', signUpController.signUp)
router.post('/login', loginController.login)

export const authRoute = router;