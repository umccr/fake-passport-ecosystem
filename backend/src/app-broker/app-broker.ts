import express                                                               from 'express';
import {errorMiddleware}                                                     from '../common/middlewares/error.middleware';
import {Account, Configuration, KoaContextWithOIDC, Provider, UnknownObject} from 'oidc-provider';
import {DynamoDBAdapter}                                                     from '../common/business/db/oidc-provider-dynamodb-adapter';
import _                                                                     from 'lodash';
import {makeJwtVisaSigned}                                                   from './business/services/visa/make-visa';
import {keyDefinitions}                                                      from './business/services/visa/keys';
import {FixturePayload, getFixture}                                          from '../common/business/fixture-payload';
import {renderLoginPage}                                                     from './pages/login/login';
import {renderHomePage}                                                      from './pages/home/home';
import {
  loggingMiddleware,
  parseMiddleware,
  setNoCacheMiddleware
}                                                                            from '../common/middlewares/util.middleware';
import {ScenarioUser}                                                        from "../common/business/scenario/scenario-data";
import {ScenarioError}                                                       from "../common/business/scenario/scenario-error";
import cors                                                                  from "cors";

/**
 * An express app wrapper that acts as a simulated GA4GH passport broker. The broker
 * is dynamically configurable to allow testing of various OIDC flows in
 * a consistent/repeatable manner.
 */
export class AppBroker {
  public readonly app: express.Application;
  public readonly env: string;

  public readonly brokerId: string;
  public readonly brokerDomain: string;

  // the fixture defines the custom behaviour and initial state of this broker
  public fixture: FixturePayload;

  // the OIDC provider that is custom configured for this fixture/broker.
  private readonly provider: Provider;

  constructor(brokerId: string, brokerDomain: string, fixture: FixturePayload, localBootstrap = false) {
    this.app = express();
    this.env = process.env.NODE_ENV || 'development';
    this.brokerId = brokerId;
    this.brokerDomain = brokerDomain;
    this.fixture = fixture;

    this.app.use(cors())

    const issuer = localBootstrap ? 'http://localhost:3000' : `https://${brokerId}.${this.brokerDomain}`;

    this.provider = this.createProvider(issuer, fixture);

    // set our logging format
    this.app.use(loggingMiddleware);

    // a home page for each broker that can give out useful info
    this.app.get('/', async (req, res) => {
      res.status(200).send(await renderHomePage(brokerId, fixture));
    });

    // update which fixture is being used
    this.app.get('/setFixture', async (req, res) => {
      const fixtureId = req.query.fixtureId as string;

      if (!fixtureId) {
        res.status(400).json({error: 'missing fixture id'})
        return
      }

      await this.setFixture(fixtureId)
      res.status(200)
      res.send()
    } )

    // register our interaction endpoints
    this.app.get(AppBroker.getInteractionRoute(null), setNoCacheMiddleware, (req, res, next) => this.handleInteraction(req, res, next));

    this.app.post(AppBroker.getInteractionRoute(null, 'login'), setNoCacheMiddleware, parseMiddleware, (req, res, next) =>
      this.handleInteractionLoginPostAction(req, res, next),
    );

    // TODO: this.app.post(AppBroker.getInteractionRoute(null, 'consent'), setNoCacheMiddleware, parseMiddleware, (req, res, next) => XXXXX(req, res, next));

    // register the provider (all the OIDC endpoints /auth, /token etc)
    this.app.use(this.provider.callback());
    this.app.use(errorMiddleware);
  }

  public async setFixture(fixtureId: string) {
    this.fixture = await getFixture(fixtureId)
    return
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

  /**
   * Create a custom OIDC provider configured for our fixture.
   *
   * @param issuer
   * @param fixture
   * @private
   */
  private createProvider(issuer: string, fixture: FixturePayload): Provider {
    // gradually flesh this config out with as much dynamic behaviour as we
    // need to support various fixtures
    const config: Configuration = {
      findAccount: (ctx, sub, code) => this.findAccount(sub, ctx),
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
          return AppBroker.getInteractionRoute(interaction.uid);
        },
      },
      routes: {
        authorization: '/auth',
        //backchannel_authentication: '/backchannel',
        //code_verification: '/device',
        //device_authorization: '/device/auth',
        //end_session: '/session/end',
        //introspection: '/token/introspection',
        jwks: '/jwks',
        //pushed_authorization_request: '/request',
        //registration: '/reg',
        //revocation: '/token/revocation',
        token: '/token',
        // THIS IS NOT THE OIDC LIBRARY DEFAULT - CHANGED TO MATCH SPEC
        userinfo: '/userinfo',
      },
      features: {
        devInteractions: { enabled: false }, // defaults to true

        //revocation: { enabled: true }, // defaults to false
        //issAuthResp: { enabled: true, ack: 'draft-04' }, // defaults to false
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

    config.jwks = fixture.providerRaw.jwks;
    config.clients = fixture.providerRaw.clients;
    config.cookies = fixture.providerRaw.cookies;

    const prov = new Provider(issuer, {
      adapter: DynamoDBAdapter,
      ...config,
    });

    /*prov.use(async (ctx, next) => {
      console.log('pre middleware', ctx?.method, ctx?.path);

      await next();
      // post-processing
      //  since internal route matching was already executed you may target a specific action here
      //  checking `ctx.oidc.route`, the unique route names used are
      //
      //  `authorization`
      //  `backchannel_authentication`
      //  `client_delete`
      //  `client_update`
      //  `client`
      //  `code_verification`
      //  `cors.device_authorization`
      //  `cors.discovery`
      //  `cors.introspection`
      //  `cors.jwks`
      //  `cors.pushed_authorization_request`
      //  `cors.revocation`
      //  `cors.token`
      //  `cors.userinfo`
      //  `device_authorization`
      //  `device_resume`
      //  `discovery`
      //  `end_session_confirm`
      //  `end_session_success`
      //  `end_session`
      //  `introspection`
      //  `jwks`
      //  `pushed_authorization_request`
      //  `registration`
      //  `resume`
      //  `revocation`
      //  `token`
      //  `userinfo`
      //
      console.log('post middleware', ctx?.method, ctx?.oidc?.route);
    }); */

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

    const tokenExchangeHandler = async (ctx: any, next: any) => {
      console.log(ctx);
      // ctx.oidc.params holds the parsed parameters
      // ctx.oidc.client has the authenticated client
      // your grant implementation
      // see /lib/actions/grants for references on how to instantiate and issue tokens
    };

    prov.registerGrantType(grantType, tokenExchangeHandler, parameters, allowedDuplicateParameters);

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
  private async handleInteraction(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      // the interaction details are persisted automatically by the OIDC provider
      // as part of its flow
      const interactionDetails = await this.provider.interactionDetails(req, res);

      const { grantId, prompt, uid, params, session } = interactionDetails;

      switch (prompt.name) {
        case 'login':
          await this.handleInteractionLoginStart(uid, req, res, next);
          break;

        case 'consent':
          if (!session) throw new Error('Session details were empty');

          const consentResult = await this.handleInteractionConsent(session, grantId, prompt.details);

          await this.provider.interactionFinished(req, res, consentResult, { mergeWithLastSubmission: true });
          break;

        default:
          throw new Error('Unknown interaction prompt');
      }
    } catch (err) {
      return next();
    }
  }

  /**
   * Dynamically handle the interaction logic needed for a login - based on what setup has been made in the
   * underlying Fixture. For example, this must handle the logic of presenting a HTML login page, but also
   * handle skipping the login page entirely and just pretending a user was logged in.
   *
   * @param uid
   * @param req
   * @param res
   * @param next
   * @private
   */
  private async handleInteractionLoginStart(uid: string, req: express.Request, res: express.Response, next: express.NextFunction) {
    if (this.fixture.loginStage.forceSubject) {
      console.log(`Handling login with force of subject to be ${this.fixture.loginStage.forceSubject}`);

      const loginResult = {
        login: { accountId: this.fixture.loginStage.forceSubject, remember: false },
      };

      await this.provider.interactionFinished(req, res, loginResult, { mergeWithLastSubmission: false });
    } else {
      console.log(`Handling login with real login page`);

      res.status(200).send(await renderLoginPage(AppBroker.getInteractionRoute(uid, 'login'), this.fixture.scenario!.getUserSubjectIds()));
    }
  }

  private async handleInteractionLoginPostAction(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = req.body.user;

    const loginResult = {
      login: { accountId: user, remember: false },
    };

    await this.provider.interactionFinished(req, res, loginResult, { mergeWithLastSubmission: false });
  }

  // TODO: introduce some return types here
  private async handleInteractionConsent(session: any, grantId: string | undefined, details: UnknownObject): Promise<any> {
    console.log(session);
    console.log(details);
    if (this.fixture.consentStage.forceAccept) {
      console.log('Handling consent');
      let grant;

      if (grantId) {
        // we'll be modifying existing grant in existing session
        grant = await this.provider.Grant.find(grantId);
      } else {
        // we're establishing a new grant
        grant = new this.provider.Grant({
          accountId: session.accountId,
          clientId: 'client',
        });
      }

      if (!grant) throw new Error('grant was empty');

      if (details.missingOIDCScope) {
        if (_.isArray(details.missingOIDCScope)) grant.addOIDCScope(details.missingOIDCScope.join(' '));
      }
      if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims as string[]);
        // use grant.rejectOIDCClaims to reject a subset or the whole thing
      }
      if (details.missingResourceScopes) {
        // eslint-disable-next-line no-restricted-syntax
        for (const [indicator, scopes] of Object.entries(details.missingResourceScopes as any[])) {
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

      return result;
    } else {
      throw new Error('Consent page not implemented');
    }
  }

  /**
   *
   * @param ctx koa request context
   * @param sub account identifier (subject)
   * @private
   */
  public async findAccount(sub: string, ctx?: KoaContextWithOIDC): Promise<Account | undefined > {
    // @param token - is a reference to the token used for which a given account is being loaded,
    //   is undefined in scenarios where claims are returned from authorization endpoint
    const user = this.fixture.scenario?.getUserById(sub);

    if (!user) {
      return;
    }

    let visas: string[] = []

    switch(this.fixture.scenarioId) {
      case '2022': {
        visas = await this.generateVisas2022(user, false);
        break
      }
      case 'errors': {
        visas = await AppBroker.generateVisasWithError(user)
      }
    }

    // return {
    //   accountId: sub,
    //   claims: {
    //     sub: sub,
    //     ga4gh_passport_v1: visas
    //   }
    // }
    return {
      accountId: sub,
      claims: async (use, scope, claims, rejected) => {
        return {
          sub: sub,
          ga4gh_passport_v1: visas
        };
      },
    }
  }

  private async generateVisas2022(user: ScenarioUser, isLinkedAccount: boolean = false): Promise<string[]> {
      const {sub, roles} = user
      const visas: string[] = []

      switch (user.sub) {
        case 'invalidVisaSignature': {
          const visa = await AppBroker.generateVisa(user.sub, '', Date.now(), '90d', '')
          const visaWithInvalidSignature = AppBroker.invalidateSignature(visa)
          visas.push(visaWithInvalidSignature)
          break
        }
        case 'expiredVisa': {
          const errorVisa = await AppBroker.generateVisa(user.sub, '', Date.now(), '0s', '') // this visa will expire on creation
          visas.push(errorVisa)
          break
        }
        case 'invalidIssuer': {
          const errorVisa = await AppBroker.generateVisa(user.sub, '', Date.now(), '90d', '', 'fakeissuer.com')
          visas.push(errorVisa)
        }
      }

      if (roles.dataset) {
          const controlledAccessVisa = await AppBroker.generateVisa(sub, 'ControlledAccessGrants', roles.dataset.approvedAt, '90d', roles.dataset.dataset)
          visas.push(controlledAccessVisa)
      }

      if (roles.institution) {
          const affiliationAndRoleVisa = await AppBroker.generateVisa(sub, 'AffiliationAndRole', Date.now(), '90d', roles.institution)
          visas.push(affiliationAndRoleVisa)
      }

      if (roles.termsAndPolicies) {
          const acceptedTermsAndPoliciesVisa = await AppBroker.generateVisa(sub, 'AcceptedTermsAndPoliciesVisa', Date.now(), '90d', 'true')
          visas.push(acceptedTermsAndPoliciesVisa)
      }

      if (roles.researcherStatus) {
          const researcherStatusVisa = await AppBroker.generateVisa(sub, 'ResearcherStatus', Date.now(), '90d', roles.researcherStatus)
          visas.push(researcherStatusVisa)
      }

      if (roles.linkedIdentity && !isLinkedAccount) {
          const linkedUser = this.fixture.scenario?.getUserById(roles.linkedIdentity)
          // is this the right way to go with linked identities? generate all visas for all linked identities
          if (linkedUser) {
              const linkedVisas = await this.generateVisas2022(linkedUser, true)
              linkedVisas.forEach((linkedVisa: any) => {
                  visas.push(linkedVisa)
              })
          }
          // then generate linked identity visa
          const linkedIdentityVisa = await AppBroker.generateVisa(sub, 'LinkedIdentities', Date.now(),'90d', roles.linkedIdentity)
          visas.push(linkedIdentityVisa)
      }
      return visas
  }

  private static async generateVisasWithError(user: ScenarioUser): Promise<string[]> {
    const visasWithErrors = []
    const errorScenarioUsers = new ScenarioError().getUsers()

    switch (user.sub) {
      case 'invalidVisaSignature': {
        const visa = await AppBroker.generateVisa(user.sub, '', Date.now(), '90d', '')
        const visaWithInvalidSignature = AppBroker.invalidateSignature(visa)
        visasWithErrors.push(visaWithInvalidSignature)
        break
      }
      case 'expiredVisa': {
        const errorVisa = await AppBroker.generateVisa(user.sub, '', Date.now(), '0s', '') // this visa will expire on creation
        visasWithErrors.push(errorVisa)
        break
      }
      case 'invalidIssuer': {
        const invalidIssuerUser = errorScenarioUsers['invalidIssuer']
        const errorVisa = await AppBroker.generateVisa(invalidIssuerUser.sub, '', Date.now(), '0s', '', 'fakeissuer.com')
        visasWithErrors.push(errorVisa)
      }
    }

    return visasWithErrors
  }

  private static invalidateSignature(jwt: string) {
    const jwtComponents = jwt.split('.')
    // decode header
    let header = JSON.parse(atob(jwtComponents[0]))
    // replacing 'alg' with 'none' invalidates the signature
    header.alg = 'none'
    return `${btoa(JSON.stringify(header))}.${jwtComponents[1]}.${jwtComponents[2]}`
  }

  private static async generateVisa(sub: string, type: string, asserted: number, duration: string | number, value: string, issuer: string = 'https://dac.madeup.com.au'): Promise<any> {
      const kid = 'rfc-rsa'
      return await makeJwtVisaSigned(
          keyDefinitions,
          issuer,
          kid,
          sub,
          duration,
          {
              ga4gh_visa_v1: {
                  type,
                  asserted,
                  value,
                  source: 'software system',
                  by: 'dac',
              },
          },
      )
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
  private static getInteractionRoute(uid: string | null = null, action: string | null = null): string {
    // chose between making a real url, or an express route
    const base = uid ? `/interaction/${uid}` : '/interaction/:uid';

    // if present, add an action
    if (action) return `${base}/${action}`;
    else return base;
  }
}

/*

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

// should show a login page here - with a drop-down of users to pick from the active scenario
// the 'login' button of that page should then hit the URL
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
    });*/
