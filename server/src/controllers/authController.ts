import { Request, Response } from "express";

export const login = async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({
      message: "Email is required.",
    });
  }

  return res.status(200).json({
    message: "Login route ready.",
    user: { email },
  });
};

export const signup = async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({
      message: "Email is required.",
    });
  }

  return res.status(201).json({
    message: "Signup route ready.",
    user: { email },
  });
};
