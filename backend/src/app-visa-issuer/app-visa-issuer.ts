import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "../common/middlewares/error.middleware";
import { makeJwks } from "../common/crypto/make-jwks";
import { JWKS } from "oidc-provider";
import {AnyJose} from "../common/crypto/jose-keys/any-jose";

export abstract class AppVisaIssuer {
  public readonly app: express.Application;

  public readonly kid: string;
  public readonly jwks: JWKS;

  protected constructor(protected id: string, protected issuer: string, protected key: AnyJose) {
    this.app = express();

    // if the key provides a kid then we use that throughout
    // but given this is just a demonstration system - we also don't mind just defaulting to a made up kid of 1234
    this.kid = key.kid ? key.kid : "1234";
    this.jwks =  makeJwks({ [this.kid]: key });

    // we want the favicon middleware to serve this first, so it avoids any logging - as it is irrelevant to us
    // TODO: reenable for ESM this.app.use(favicon(path.join(__dirname, 'favicon.ico')));
    this.app.use(helmet.hidePoweredBy());

    morgan.token("res-headers", (req, res) => {
      return JSON.stringify(res.getHeaders());
    });

    // set our logging format
    this.app.use(morgan("EXPRESS :method :url :response-time :res-headers"));

    this.app.get("/", (req, res) => {
      return res.send("Top");
    });

    this.app.get("/.well-known/openid-configuration", async (req, res) => {
      const config = {
        issuer: this.issuer,
        jwks_uri: this.issuer + "/.well-known/jwks",
      };

      res.status(200).json(config);
    });

    this.app.get("/.well-known/jwks", async (req, res) => {
      res.status(200).json(this.jwks);
    });

    this.app.get("/visa", async (req, res) => {
      res.status(200).json({
        visa: this.createVisaFor("andrew")
      });
    });

    this.app.use(errorMiddleware);
  }

  public listen(port: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.app.listen(port, () => {
        console.log(
          `Started visa issuer ${this.id} with config at ${this.issuer}/.well-known/openid-configuration`,
        );
        resolve();
      });
    });
  }

  public getServer() {
    return this.app;
  }

  public getId(): string {
    return this.id;
  }

  public abstract createVisaFor(subjectId: string): Promise<string>;
}
