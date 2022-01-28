import { NextFunction, Request, Response } from 'express';

export class HttpException extends Error {
  public status: number;
  public message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

/**
 * Middleware that makes sure any exceptions get logged to console/cloudwatch
 * before being processed in the rest of Express.
 *
 * @param error
 * @param req
 * @param res
 * @param next
 */
export const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'Something went wrong';

    console.log(`StatusCode : ${status}, Message : ${message}`);

    res.status(status).json({ message });
  } catch (error) {
    next(error);
  }
};
