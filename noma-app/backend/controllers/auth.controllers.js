import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/user.model.js'
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';

export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // create new user 
        const { name, phone, email, location, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne( {email});
        // const existingUser = await User.findOne({ email });

        if(existingUser) {
            const error = new Error('User already exists');
            error.statusCode = 409;
            throw error;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUsers = await User.create([{ name, email, phone, location, password: hashedPassword }], { session });

        // const token = jwt.sign( payload: { userId: newUsers[0]._id }, JWT_SECRET, options: { expiresIn: JWT_EXPIRES_IN});
        const token = jwt.sign( { userId: newUsers[0]._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN});


        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                token,
                user: newUsers[0]
            }
        })
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}

export const signIn = async (req, res, next) => {
    try {
        const { phone, email, password } = req.body;
        const user = await User.findOne({ email });

        if(!user){
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            const error = new Error('Invalid Password');
            error.statusCode = 401;
            throw error;
        }

        const token = jwtsign({ userId: user_.id }, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});

        res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            data: {
                token,
                user,
            }
        }); 
    } catch (error) {
        next(error);
    }
}

export const signOut = async (req, res, next) => {}

