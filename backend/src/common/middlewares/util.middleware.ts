import bodyparser from "body-parser";
import morgan from "morgan";

export const setNoCacheMiddleware = (req: any, res: any, next: any) => {
  res.set("Pragma", "no-cache");
  res.set("Cache-Control", "no-cache, no-store");
  next();
};

export const parseMiddleware = bodyparser.urlencoded({ extended: false });

morgan.token("res-headers", (req, res) => {
  return JSON.stringify(res.getHeaders());
});

export const loggingMiddleware = morgan(
  "EXPRESS :method :url :response-time :res-headers",
);
