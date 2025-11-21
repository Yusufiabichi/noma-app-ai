import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js'
import { getUser, getUsers } from '../controllers/user.controller.js';

const userRouter = Router();

userRouter.get('/', getUsers)
userRouter.get('/:id', authorize, getUser)
userRouter.post('/', (req, res) => res.send({title: 'Create a new user'}))
userRouter.put('/:id', (req, res) => res.send({title: 'Update user'}))
userRouter.delete('/:id', (req, res) => res.send({title: 'Delete user'}))


export default userRouter;