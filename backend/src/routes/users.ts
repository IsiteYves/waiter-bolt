import { Request, Response } from "express";
import prisma from "../client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function getUsers(_req: Request, res: Response) {
        const user = await prisma.user.findMany();
        return res.json(user);
}

export async function createUser(req: Request, res: Response) {
        const { name, password, email } = req.body;

        if (!name || !password || !email) {
                return res.status(400).json({
                        error: "Please provide all required fields",
                });
        }

        try {
                const findUser = await prisma.user.findUnique({
                        where: {
                                email,
                        },
                });

                if (findUser) {
                        return res
                                .status(400)
                                .json({ message: "user already exists" });
                }

                const hashedPassword = await bcrypt.hash(password, 12);

                const createdUser = await prisma.user.create({
                        data: {
                                name,
                                password: hashedPassword,
                                email,
                        },
                });

                return res.json({ data: createdUser });
        } catch (e) {
                res.status(401).json({ message: e });
        }
        // const hashedPassword = await bcrypt.hash(password, 10);
}

export async function login(req: Request, res: Response) {
        const { email, password } = req.body;

        if (!email || !password) {
                return res.status(400).json({
                        error: "Please provide all required fields",
                });
        }

        const user = await prisma.user.findUnique({
                where: {
                        email,
                },
        });

        if (!user) {
                return res.status(401).json({
                        message: "Invalid email or password",
                });
        }

        let comparePassword = await bcrypt.compare(password, user.password);

        if (!comparePassword) {
                return res.status(401).json({
                        message: "Invalid email or password",
                });
        }

        const token = jwt.sign(
                {
                        userId: user.id,
                        email: user.email,
                },
                "secret",
                {
                        expiresIn: "1h",
                }
        );

        return res.json({
                token,
                user,
        });
}