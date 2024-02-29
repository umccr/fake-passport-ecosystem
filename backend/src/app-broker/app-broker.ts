import express from "express";
import { errorMiddleware } from "../common/middlewares/error.middleware";
import Provider, {
  Configuration,
  JWKS,
  KoaContextWithOIDC,
  UnknownObject,
} from "oidc-provider";
import { DynamoDBAdapter } from "../common/db/oidc-provider-dynamodb-adapter";
import _, { isString } from "lodash";
import { renderLoginPage } from "./pages/login/login";
import {
  loggingMiddleware,
  parseMiddleware,
  setNoCacheMiddleware,
} from "../common/middlewares/util.middleware";
import { AppVisaIssuer } from "../app-visa-issuer/app-visa-issuer";
import { AnyJose } from "../common/crypto/jose-keys/any-jose";
import { makeJwksForOidcProvider } from "../common/crypto/make-jwks";
import cryptoRandomString from "crypto-random-string";
import { renderHomePage } from "./pages/home/home";
import { makePassportJwt } from "../common/ga4gh/make-passport-jwt";
import {
  URN_GA4GH_TOKEN_TYPE_PASSPORT,
  URN_GRANT_TYPE_TOKEN_EXCHANGE,
} from "../common/constants";

/**
 * An express app wrapper that acts as a simulated GA4GH passport broker. The broker
 * is configurable to allow testing of various OIDC flows in
 * a consistent/repeatable manner.
 */
export abstract class AppBroker {
  private readonly app: express.Application;

  private readonly kid: string;

  // the JWKS for OIDC has private key data in the JWKS
  private readonly jwksForOidcProvider: JWKS;

  // the OIDC provider that is custom configured for this fixture/broker.
  protected readonly provider: Provider;

  protected constructor(
    protected readonly id: string,
    protected readonly issuer: string,
    protected readonly signingKey: AnyJose,
    protected readonly visaIssuers: AppVisaIssuer[],
  ) {
    this.app = express();

    // if the key provides a kid then we use that throughout
    // but given this is just a demonstration system - we also don't mind just defaulting to a made up kid of 9876
    this.kid = signingKey.kid ? signingKey.kid : "9876";

    this.jwksForOidcProvider = makeJwksForOidcProvider({
      [this.kid]: signingKey,
    });

    this.provider = this.createProvider(issuer);

    // set our logging format
    this.app.use(loggingMiddleware);

    // a home page for each broker that can give out useful info
    this.app.get("/", async (req, res) => {
      res
        .status(200)
        .send(await renderHomePage(id, this.description(), this.userList()));
    });

    // register our interaction endpoints
    this.app.get(
      AppBroker.getInteractionRoute(null),
      setNoCacheMiddleware,
      (req, res, next) => this.handleInteraction(req, res, next),
    );

    // this post is the endpoint when the user hits the Login button
    this.app.post(
      AppBroker.getInteractionRoute(null, "login"),
      setNoCacheMiddleware,
      parseMiddleware,
      (req, res, next) => this.handleInteractionLoginPostAction(req, res, next),
    );

    // register the provider (all the OIDC endpoints /auth, /token etc)
    this.app.use(this.provider.callback());

    this.app.use(errorMiddleware);
  }

  public listen(port: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.app.listen(port, () => {
        console.log(
          `Started broker ${this.id} with config at ${this.issuer}/.well-known/openid-configuration`,
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

  abstract userList(): string[];

  abstract description(): string;

  protected async createPassportFor(sub: string): Promise<any> {
    const allVisas = await Promise.all(
      this.visaIssuers.map((vi) => vi.createVisaFor(sub)),
    );

    return {
      access_token: await makePassportJwt(
        this.signingKey,
        this.issuer,
        this.kid,
        sub,
        allVisas.filter((n) => isString(n)) as string[],
      ),
      issued_token_type: URN_GA4GH_TOKEN_TYPE_PASSPORT,
      token_type: "Bearer",
      // expires_in: "",
      // scope: "",
      // refresh_token: "",
    };
  }

  /**
   * Creates the base configuration passed to our OIDC provider. Some aspects of
   * this configuration are configured by abstract methods on the broker class.
   * The other intercept point would be to override this method entirely and
   * make direct alterations of the configuration object.
   *
   * @returns An OIDC provider configuration object
   * @protected
   */
  protected createConfig(): Configuration {
    return {
      findAccount: (ctx, sub, code) => {
        // if the subject id is not in our subject list then we return nothing here
        // to indicate a fail
        if (!this.userList().includes(sub)) {
          return;
        }

        // an intercept point for the claims of our OIDC JWTs (not passports - currently unused)
        return {
          accountId: sub,
          claims: async (use, scope, claims, rejected) => {
            return {
              sub: sub,
            };
          },
        };
      },
      claims: {
        ga4gh: ["ga4gh_passport_v1"],
        openid: ["sub"],
      },
      clientDefaults: {
        grant_types: ["authorization_code", URN_GRANT_TYPE_TOKEN_EXCHANGE],
        id_token_signed_response_alg: "RS256",
        response_types: ["code"],
        token_endpoint_auth_method: "client_secret_basic",
      },
      interactions: {
        // this returns the URL location for our UI interactions
        // i.e. for interaction "login" - this returns the URL of the login page
        url: (ctx: any, interaction: any) => {
          return AppBroker.getInteractionRoute(interaction.uid);
        },
      },
      routes: {
        authorization: "/auth",
        //backchannel_authentication: '/backchannel',
        //code_verification: '/device',
        //device_authorization: '/device/auth',
        //end_session: '/session/end',
        //introspection: '/token/introspection',
        jwks: "/jwks",
        //pushed_authorization_request: '/request',
        //registration: '/reg',
        //revocation: '/token/revocation',
        token: "/token",
        // THIS IS NOT THE OIDC LIBRARY DEFAULT - CHANGED TO MATCH GA4GH PASSPORT SPEC
        userinfo: "/userinfo",
      },
      features: {
        devInteractions: { enabled: false }, // defaults to true

        //revocation: { enabled: true }, // defaults to false
        //issAuthResp: { enabled: true, ack: 'draft-04' }, // defaults to false
        // resourceIndicators: {
        //   async getResourceServerInfo(ctx, resourceIndicator, client) {
        //     return {
        //       scope: "api:read",
        //       audience: resourceIndicator,
        //       accessTokenFormat: "jwt",
        //     };
        //   },
        //   enabled: true,
        //   defaultResource: (ctx) => {
        //     //if (ctx.oidc.body && ctx.oidc.body.nodefault) {
        //     //    return undefined;
        //     // }
        //     return "urn:wl:opaque:default";
        //   },
        // },
      },
      pkce: {
        methods: ["S256"],
        // unless the client makes clear it wants PKCE - whether it is required defaults to this logic
        required: (ctx, client) => {
          return false;
        },
      },
      // note that this JWKS is used internally by the OIDC provider to actually do encryption
      // so *is not* the JWKS that gets exposed publicly (private key data is stripped by OIDC provider)
      jwks: this.jwksForOidcProvider,
      clients: [
        {
          client_id: "client",
          client_secret: "secret",
          redirect_uris: [
            "http://localhost:3000/callback-broker-1",
            "http://localhost:3000/callback-broker-2",
            "http://localhost:3000/callback-broker-3",
            "http://localhost:3000/callback-broker-4",
          ],
        },
      ],
      cookies: {
        keys: [cryptoRandomString({ length: 16, type: "url-safe" })],
      },
    };
  }

  /**
   * Create a custom OIDC provider configured for this broker.
   *
   * @param issuer
   */
  protected createProvider(issuer: string): Provider {
    const config = this.createConfig();

    const prov = new Provider(issuer, {
      adapter: DynamoDBAdapter,
      ...config,
    });

    // define our token exchang endpoint that will be used to hand out passports

    const parameters = [
      "audience",
      "resource",
      "scope",
      "requested_token_type",
      "subject_token",
      "subject_token_type",
      "actor_token",
      "actor_token_type",
    ];
    const allowedDuplicateParameters = ["audience", "resource"];

    const tokenExchangeHandler = async (ctx: KoaContextWithOIDC, next: any) => {
      // ctx.oidc.params holds the parsed parameters
      // ctx.oidc.client has the authenticated client
      // your grant implementation
      // see /lib/actions/grants for references on how to instantiate and issue tokens
      try {
        console.log(ctx.oidc.params);
        console.log(ctx.oidc.client);

        const requestedTokenType = ctx?.oidc?.params?.[
          "requested_token_type"
        ] as string;

        if (requestedTokenType !== URN_GA4GH_TOKEN_TYPE_PASSPORT)
          throw new Error(
            "Token exchange can only be made for a passport token",
          );

        const subjectToken = ctx?.oidc?.params?.["subject_token"] as string;

        if (!subjectToken)
          throw new Error(
            "Token exchange must have a subject token that is a passport-scoped access token",
          );

        const subjectTokenType = ctx?.oidc?.params?.[
          "subject_token_type"
        ] as string;

        if (
          subjectTokenType !== "urn:ietf:params:oauth:token-type:access_token"
        )
          throw new Error(
            "Token exchange can only be made with a subject token of access token type",
          );

        // correlate the passed in subject token with access tokens known to us
        const accessToken =
          await ctx.oidc.provider.AccessToken.find(subjectToken);

        if (!accessToken)
          throw new Error(
            "subject_token did not correspond to known access token",
          );

        // TODO: check the access tokens have ga4gh scope

        console.log(accessToken);

        let audience = ctx?.oidc?.params?.["audience"];

        // if (isString(audience))
        //  audience = [ audience ];
        console.log(audience);

        let resource = ctx?.oidc?.params?.["resource"];

        console.log(resource);

        ctx.body = await this.createPassportFor(accessToken.accountId);
      } catch (e) {
        console.error(e);
        return next(e);
      }

      await next();
    };

    prov.registerGrantType(
      URN_GRANT_TYPE_TOKEN_EXCHANGE,
      tokenExchangeHandler,
      parameters,
      allowedDuplicateParameters,
    );

    /*
    // configure any middleware intercepting
    prov.use(async (ctx, next) => {
      console.log('pre middleware', ctx?.method, ctx?.path);
    
      await next();
      // post-processing
      //  since internal route matching was already executed you may target a specific action here
      //  checking `ctx.oidc.route`, the unique route names used are
      // see https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#pre--and-post-middlewares
      
      console.log('post middleware', ctx?.method, ctx?.oidc?.route);
    }); */

    return prov;
  }

  /**
   * The master controller endpoint for handling interactions with the OIDC provider. Basically
   * a switch statement of whether we are doing login or consent - but flexible enough for other
   * interactions if needed.
   *
   * @param req
   * @param res
   * @param next
   * @private
   */
  private async handleInteraction(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    try {
      // the interaction details are persisted automatically by the OIDC provider
      // as part of its flow
      const interactionDetails = await this.provider.interactionDetails(
        req,
        res,
      );

      const { grantId, prompt, uid, params, session } = interactionDetails;

      switch (prompt.name) {
        case "login":
          await this.handleInteractionLoginStart(uid, req, res, next);
          break;

        case "consent":
          const consentResult = await this.handleInteractionConsent(
            session,
            grantId,
            prompt.details,
          );

          await this.provider.interactionFinished(req, res, consentResult, {
            mergeWithLastSubmission: true,
          });
          break;

        default:
          throw new Error("Unknown interaction prompt");
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  /**
   * Present a login page based on this classes config.
   *
   * @param uid
   * @param req
   * @param res
   * @param next
   * @private
   */
  private async handleInteractionLoginStart(
    uid: string,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    res
      .status(200)
      .send(
        await renderLoginPage(
          AppBroker.getInteractionRoute(uid, "login"),
          this.description(),
          this.userList(),
        ),
      );
  }

  private async handleInteractionLoginPostAction(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    const user = req.body.user;

    const loginResult = {
      login: { accountId: user, remember: false },
    };
    await this.provider.interactionFinished(req, res, loginResult, {
      mergeWithLastSubmission: false,
    });
  }

  /**
   * Handle the consent portion of an OIDC flow - given the demonstration nature of
   * this broker we just silently do the work to grant consent.
   *
   * @param session
   * @param grantId
   * @param details
   * @private
   */
  private async handleInteractionConsent(
    session: any,
    grantId: string | undefined,
    details: UnknownObject,
  ): Promise<any> {
    let grant;

    if (grantId) {
      // we'll be modifying existing grant in existing session
      grant = await this.provider.Grant.find(grantId);
    } else {
      // we're establishing a new grant
      grant = new this.provider.Grant({
        accountId: session.accountId,
        clientId: "client",
      });
    }

    if (!grant) throw new Error("grant was empty");

    if (details.missingOIDCScope) {
      if (_.isArray(details.missingOIDCScope))
        grant.addOIDCScope(details.missingOIDCScope.join(" "));
    }
    if (details.missingOIDCClaims) {
      grant.addOIDCClaims(details.missingOIDCClaims as string[]);
      // use grant.rejectOIDCClaims to reject a subset or the whole thing
    }
    if (details.missingResourceScopes) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [indicator, scopes] of Object.entries(
        details.missingResourceScopes as any[],
      )) {
        grant.addResourceScope(indicator, scopes.join(" "));
        // use grant.rejectResourceScope to reject a subset or the whole thing
      }
    }

    grantId = await grant.save();

    const consent: any = {};
    if (!details.grantId) {
      // we don't have to pass grantId to consent, we're just modifying existing one
      consent.grantId = grantId;
    }

    return { consent };
  }

  /**
   * We have a variety of places where we need to make our custom interaction
   * routes urls - which can be anything - but need to be consistent. So we make
   * a single method here that can construct them both for express routing
   * and 'prefilled' if we know the uid already. Also supports adding an
   * action to the url.
   *
   * @param uid
   * @param action
   * @private
   */
  private static getInteractionRoute(
    uid: string | null = null,
    action: string | null = null,
  ): string {
    // chose between making a real url, or an express route
    const base = uid ? `/interaction/${uid}` : "/interaction/:uid";

    // if present, add an action
    if (action) return `${base}/${action}`;
    else return base;
  }
}
