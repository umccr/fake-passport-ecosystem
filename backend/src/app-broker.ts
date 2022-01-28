import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import favicon from 'serve-favicon';
import { errorMiddleware } from './middlewares/error.middleware';
import path from 'path';
import { Configuration, Provider } from 'oidc-provider';
import { DynamoDBAdapter } from './business/db/oidc-provider-dynamodb-adapter';
import * as pug from 'pug';
import _ from 'lodash';
import { makeJwtVisaSigned } from './business/services/visa/make-visa';
import { keyDefinitions } from './business/services/visa/keys';
import { BrokerPayload } from './business/db/broker-payload';
import { getMandatoryEnv } from './app-env';

const oidcConfig: Configuration = {
  findAccount: async (ctx, sub, token) => {
    // @param ctx - koa request context
    // @param sub {string} - account identifier (subject)
    // @param token - is a reference to the token used for which a given account is being loaded,
    //   is undefined in scenarios where claims are returned from authorization endpoint
    return {
      accountId: sub,
      // @param use {string} - can either be "id_token" or "userinfo", depending on
      //   where the specific claims are intended to be put in
      // @param scope {string} - the intended scope, while oidc-provider will mask
      //   claims depending on the scope automatically you might want to skip
      //   loading some claims from external resources or through db projection etc. based on this
      //   detail or not return them in ID Tokens but only UserInfo and so on
      // @param claims {object} - the part of the claims authorization parameter for either
      //   "id_token" or "userinfo" (depends on the "use" param)
      // @param rejected {Array[String]} - claim names that were rejected by the end-user, you might
      //   want to skip loading some claims from external resources or through db projection
      claims: async (use, scope, claims, rejected) => {
        return {
          sub: sub,
          ga4gh_passport_v1: [
            await makeJwtVisaSigned(
              keyDefinitions,
              'https://dac.madeup.com.au',
              'rfc-rsa',
              sub,
              { days: 90 },
              {
                ga4gh_visa_v1: {
                  type: 'ControlledAccessGrants',
                  // this should be the date of approval..
                  asserted: 1549632872,
                  value: 'asdad',
                  source: 'software system',
                  by: 'dac',
                },
              },
            ),
          ],
        };
      },
    };
  },
  claims: {
    ga4gh: ['ga4gh_passport_v1'],
    openid: ['sub'],
  },
  clientDefaults: {
    grant_types: ['authorization_code'],
    id_token_signed_response_alg: 'RS256',
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_basic',
  },
  interactions: {
    url: (ctx: any, interaction: any) => {
      return `/interaction/${interaction.uid}`;
    },
  },
  features: {
    devInteractions: { enabled: false }, // defaults to true

    revocation: { enabled: true }, // defaults to false
    issAuthResp: { enabled: true }, // defaults to false
    resourceIndicators: {
      async getResourceServerInfo(ctx, resourceIndicator, client) {
        return {
          scope: 'api:read',
          audience: resourceIndicator,
          accessTokenFormat: 'jwt',
        };
      },
      enabled: true,
      defaultResource: ctx => {
        //if (ctx.oidc.body && ctx.oidc.body.nodefault) {
        //    return undefined;
        // }
        return 'urn:wl:opaque:default';
      },
    },
  },
  pkce: {
    methods: ['S256'],
    // unless the client makes clear it wants PKCE - whether it is required defaults to this logic
    required: (ctx, client) => {
      // TODO: do a lookup of the client id to see if the 'test scenario' requires PKCE
      return false;
    },
  },
};

const pugView = `
doctype html
html(lang="en")
  head
    title= pageTitle
    script(type='text/javascript').
      if (foo) bar(1 + 5);
  body
    h1 Pug #{domainPrefix}
    #container.col
      p.
        Hello.
`;

export class AppBroker {
  public readonly app: express.Application;
  public readonly env: string;
  public readonly brokerDomainPrefix: string;
  public readonly brokerDomain: string;
  public readonly brokerPayload: BrokerPayload;

  constructor(brokerDomainPrefix: string, brokerPayload: BrokerPayload, localBootstrap = false) {
    this.app = express();
    this.env = process.env.NODE_ENV || 'development';
    this.brokerDomainPrefix = brokerDomainPrefix;
    this.brokerDomain = getMandatoryEnv('DOMAIN_NAME');
    this.brokerPayload = brokerPayload;

    const issuer = localBootstrap ? 'http://localhost:3000' : `https://${brokerDomainPrefix}.${this.brokerDomain}`;

    console.log(brokerPayload);

    oidcConfig.jwks = brokerPayload.providerRaw.jwks;
    oidcConfig.clients = brokerPayload.providerRaw.clients;
    oidcConfig.cookies = brokerPayload.providerRaw.cookies;

    const provider = new Provider(issuer, {
      adapter: DynamoDBAdapter,
      ...oidcConfig,
    });

    // we want the favicon middleware to serve this first, so it avoids any logging - as it is irrelevant to us
    this.app.use(favicon(path.join(__dirname, 'favicon.ico')));
    this.app.use(helmet.hidePoweredBy());

    morgan.token('res-headers', (req, res) => {
      return JSON.stringify(res.getHeaders());
    });

    // set our logging format
    this.app.use(morgan('EXPRESS :method :url :response-time :res-headers'));

    function setNoCache(req, res, next) {
      res.set('Pragma', 'no-cache');
      res.set('Cache-Control', 'no-cache, no-store');
      next();
    }

    // const parse = bodyparser.urlencoded({ extended: false });

    this.app.get('/', (req, res) => {
      res.send(pug.render(pugView, { domainPrefix: brokerDomainPrefix }));
    });

    this.app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
      try {
        const interactionDetails = await provider.interactionDetails(req, res);

        //console.log('see what else is available to you for interaction views');
        //console.log(JSON.stringify(interactionDetails, null, 2));

        const { uid, prompt, params } = interactionDetails;

        if (prompt.name === 'login') {
          const result = {
            login: { accountId: '1234567', remember: false },
          };

          await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        } else if (prompt.name === 'consent') {
          const {
            prompt: { name, details },
            params,
            session: { accountId },
          } = interactionDetails;
          let { grantId } = interactionDetails;
          let grant;

          if (grantId) {
            // we'll be modifying existing grant in existing session
            grant = await provider.Grant.find(grantId);
          } else {
            // we're establishing a new grant
            grant = new provider.Grant({
              accountId: '1234567',
              clientId: 'abcd',
            });
          }

          if (details.missingOIDCScope) {
            if (_.isArray(details.missingOIDCScope)) grant.addOIDCScope(details.missingOIDCScope.join(' '));
          }
          if (details.missingOIDCClaims) {
            grant.addOIDCClaims(details.missingOIDCClaims);
            // use grant.rejectOIDCClaims to reject a subset or the whole thing
          }
          if (details.missingResourceScopes) {
            // eslint-disable-next-line no-restricted-syntax
            for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
              grant.addResourceScope(indicator, scopes.join(' '));
              // use grant.rejectResourceScope to reject a subset or the whole thing
            }
          }

          grantId = await grant.save();

          const consent: any = {};
          if (!details.grantId) {
            // we don't have to pass grantId to consent, we're just modifying existing one
            consent.grantId = grantId;
          }

          const result = { consent };
          await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
        } else res.send(pug.render(pugView, { domainPrefix: brokerDomainPrefix }));

        /*const client = await provider.Client.find(params.client_id);

        if (prompt.name === 'login') {
          return res.render('login', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Sign-in',
            flash: undefined,
          });
        }

        return res.render('interaction', {
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Authorize',
        }); */
      } catch (err) {
        console.log(err);
        return next(err);
      }
    });

    provider.use(async (ctx, next) => {
      /** pre-processing
       * you may target a specific action here by matching `ctx.path`
       */
      //console.log('pre middleware', ctx?.method, ctx?.path);

      await next();
      /** post-processing
       * since internal route matching was already executed you may target a specific action here
       * checking `ctx.oidc.route`, the unique route names used are
       *
       * `authorization`
       * `backchannel_authentication`
       * `client_delete`
       * `client_update`
       * `client`
       * `code_verification`
       * `cors.device_authorization`
       * `cors.discovery`
       * `cors.introspection`
       * `cors.jwks`
       * `cors.pushed_authorization_request`
       * `cors.revocation`
       * `cors.token`
       * `cors.userinfo`
       * `device_authorization`
       * `device_resume`
       * `discovery`
       * `end_session_confirm`
       * `end_session_success`
       * `end_session`
       * `introspection`
       * `jwks`
       * `pushed_authorization_request`
       * `registration`
       * `resume`
       * `revocation`
       * `token`
       * `userinfo`
       */
      //console.log('post middleware', ctx?.method, ctx?.oidc?.route);
    });

    const parameters = [
      'audience',
      'resource',
      'scope',
      'requested_token_type',
      'subject_token',
      'subject_token_type',
      'actor_token',
      'actor_token_type',
    ];
    const allowedDuplicateParameters = ['audience', 'resource'];
    const grantType = 'urn:ietf:params:oauth:grant-type:token-exchange';

    const tokenExchangeHandler = async (ctx, next) => {
      // ctx.oidc.params holds the parsed parameters
      // ctx.oidc.client has the authenticated client
      // your grant implementation
      // see /lib/actions/grants for references on how to instantiate and issue tokens
    };

    // provider.registerGrantType(grantType, tokenExchangeHandler, parameters, allowedDuplicateParameters);

    this.app.use(provider.callback());

    /*this.app.post('/interaction/:uid/login', setNoCache, parse, async (req, res, next) => {
      try {
        const { uid, prompt, params } = await provider.interactionDetails(req, res);
        const client = await provider.Client.find(params.client_id);

        const accountId = await Account.authenticate(req.body.email, req.body.password);

        if (!accountId) {
          res.render('login', {
            client,
            uid,
            details: prompt.details,
            params: {
              ...params,
              login_hint: req.body.email,
            },
            title: 'Sign-in',
            flash: 'Invalid email or password.',
          });
          return;
        }

        const result = {
          login: { accountId },
        };

        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
      } catch (err) {
        next(err);
      }
    });

    this.app.post('/interaction/:uid/confirm', setNoCache, parse, async (req, res, next) => {
      try {
        const interactionDetails = await oidc.interactionDetails(req, res);
        const { prompt: { name, details }, params, session: { accountId } } = interactionDetails;
        assert.strictEqual(name, 'consent');

        let { grantId } = interactionDetails;
        let grant;

        if (grantId) {
          // we'll be modifying existing grant in existing session
          grant = await provider.Grant.find(grantId);
        } else {
          // we're establishing a new grant
          grant = new provider.Grant({
            accountId,
            clientId: params.client_id,
          });
        }

        if (details.missingOIDCScope) {
          grant.addOIDCScope(details.missingOIDCScope.join(' '));
          // use grant.rejectOIDCScope to reject a subset or the whole thing
        }
        if (details.missingOIDCClaims) {
          grant.addOIDCClaims(details.missingOIDCClaims);
          // use grant.rejectOIDCClaims to reject a subset or the whole thing
        }
        if (details.missingResourceScopes) {
          // eslint-disable-next-line no-restricted-syntax
          for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
            grant.addResourceScope(indicator, scopes.join(' '));
            // use grant.rejectResourceScope to reject a subset or the whole thing
          }
        }

        grantId = await grant.save();

        const consent = {};
        if (!interactionDetails.grantId) {
          // we don't have to pass grantId to consent, we're just modifying existing one
          consent.grantId = grantId;
        }

        const result = { consent };
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
      } catch (err) {
        next(err);
      }
    });

    this.app.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
      try {
        const result = {
          error: 'access_denied',
          error_description: 'End-User aborted interaction',
        };
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
      } catch (err) {
        next(err);
      }
    }); */

    // this.app.get('*', this.appFileServe.getHandler());

    this.initializeErrorHandling();
  }

  public listen(port: number, callback?: () => void) {
    this.app.listen(port, () => {
      console.log(`🚀 App listening on the port ${port}`);
      if (callback) callback();
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}
