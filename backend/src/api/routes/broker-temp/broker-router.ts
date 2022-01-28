import { Router } from 'express';
import { URL } from 'url';
import cryptoRandomString from 'crypto-random-string';
import { createRemoteJWKSet, importJWK, jwtVerify, SignJWT } from 'jose';

import { makeCompactVisaSigned, makeJwtVisaSigned } from '../../../business/services/visa/make-visa';
import { keyDefinitions } from '../../../business/services/visa/keys';
import { IRoute } from '../_routes.interface';
import { RsaJose } from '../../../business/services/visa/rsa-jose';

const EXCHANGE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:token-exchange';

const TOKEN_TYPE_GA4GH_COMPACT = 'urn:ga4gh:token-type:compact-passport';
const TOKEN_TYPE_IETF_ACCESS = 'urn:ietf:params:oauth:token-type:access_token';

// for our demo ecosystem we need to build a permanent stable issuers - here is our choice for where this
// is deployed.. a real ecosystem wouldn't work like this..
const BROKER_ISSUER = 'https://broker.nagim.dev';
const VISA_DAC_ISSUER = 'https://didact-nagim.dev.umccr.org';
const VISA_BROKER_ISSUER = 'https://broker.nagim.dev';

/**
 * A temporary endpoint that acts to re-sign access JWTs from CILogon, but instead
 * with passports inside.
 */
export class BrokerRoute implements IRoute {
  public path = '/broker';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/token`, async (req, res) => {
      try {
        if (req.body.grant_type != EXCHANGE_GRANT_TYPE)
          throw new Error(`The only grant type configured is token exchange - not '${req.body.grant_type}'`);

        if (req.body.subject_token_type != TOKEN_TYPE_IETF_ACCESS) throw new Error('Can only do token exchange of JWT access tokens');

        if (req.body.requested_token_type != TOKEN_TYPE_GA4GH_COMPACT) throw new Error('Can only do token exchange for compact passports');

        const payload = await this.verifyIncomingCiLogon(req.body.subject_token);

        // if we have got here then we know that we have received a validated JWT signed by cilogon

        let subjectId: string = payload.sub;

        // this is coming from a trusted source i.e. by this point we have checked the signature - but still
        // best to whitelist to the chars we expect..
        if (!subjectId.match(/[\w.:/\-]+/)) throw new Error('Subject id must contain a limited subset of characters');

        // we make a one-off preemptive call to the LDAP server to get their entry - coping with the fact
        // that the sub may be mapped to two spots (uid or voPersonId)
        /*const client = await ldapClientPromise();
        const searchResult = await ldapSearchPromise(client, 'o=NAGIMdev,o=CO,dc=biocommons,dc=org,dc=au', {
          filter: `&(objectClass=voPerson)(|(uid=${subjectId})(voPersonId=${subjectId}))`,
          scope: 'sub',
          attributes: ['voPersonID', 'cn', 'isMemberOf', 'mail'],
        }); */

        // example result
        // [
        //   {
        //     dn: 'voPersonID=https://nagim.dev/p/txtpo-yhphm-10000,ou=people,o=NAGIMdev,o=CO,dc=biocommons,dc=org,dc=au',
        //     controls: [],
        //     sn: 'PattoPatterson',
        //     cn: 'Andrew PattoPatterson',
        //     objectClass: [
        //       'person',
        //       'organizationalPerson',
        //       'inetOrgPerson',
        //       'eduMember',
        //       'voPerson'
        //     ],
        //     givenName: 'Andrew',
        //     mail: 'andrew@patto.net',
        //     uid: 'http://cilogon.org/serverA/users/46001501',
        //     isMemberOf: [
        //       'CO:members:all',
        //       'CO:members:active',
        //       'CO:COU:NAGIM devops:members:active',
        //       'CO:admins',
        //       'CO:COU:NAGIM devops:members:all',
        //       'didact:dac',
        //       'Trusted Researchers'
        //     ],
        //     'voPersonApplicationUID;app-nagim': 'https://nagim.dev/p/txtpo-yhphm-10000',
        //     'voPersonApplicationUID;app-gen3': 'andrew.patterson',
        //     voPersonID: 'https://nagim.dev/p/txtpo-yhphm-10000'
        //   }
        // ]

        // if (searchResult.length != 1) throw new Error(`Incorrect number of search results from the LDAP source when looking up ${subjectId}`);

        // our NAGIM identifier is always mapped here by LDAP
        subjectId = 'aa'; // searchResult[0].voPersonID;

        const claims = {
          ga4gh_passport_v1: [],
          ga4gh_passport_v2: {
            visas: [],
          },
        };

        // this is cheating slightly... a real broker should possibly be going off via https to talk to other visa issuers
        // in this case we are just looking up a db in the same account
        {
          const didactJwt = await getDidactJwtVisas(subjectId);
          const didactCompact = await getDidactCompactVisa(subjectId);

          if (didactJwt) claims.ga4gh_passport_v1.push(...didactJwt);
          if (didactCompact) claims.ga4gh_passport_v2.visas.push(didactCompact);
        }

        // this is some visas based off ldap grouping
        /*{
          const nagimJwt = await getNagimJwtVisas(subjectId, searchResult[0]);
          const nagimCompact = await getNagimCompactVisa(subjectId, searchResult[0]);

          if (nagimJwt) claims.ga4gh_passport_v1.push(...nagimJwt);
          if (nagimCompact) claims.ga4gh_passport_v2.visas.push(nagimCompact);
        }*/

        // dubious we should be adding in a name to the passport but helps for
        // debugging in the prototype
        //if (searchResult[0].cn) claims['name'] = searchResult[0].cn;

        const newJwtSigner = new SignJWT(claims)
          .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: 'rfc-rsa' })
          .setSubject(subjectId)
          .setIssuedAt()
          .setIssuer(BROKER_ISSUER)
          .setExpirationTime('365d')
          .setJti(cryptoRandomString({ length: 16, type: 'alphanumeric' }));

        const srcKey = keyDefinitions['rfc-rsa'] as RsaJose;

        const srcKeyAsPrivateJwk = {
          alg: 'RS256',
          kty: 'RSA',
          e: srcKey.e,
          n: srcKey.n,
          d: srcKey.dBase64Url,
          p: srcKey.pBase64Url,
          q: srcKey.qBase64Url,
          dp: srcKey.dpBase64Url,
          dq: srcKey.dqBase64Url,
          qi: srcKey.qiBase64Url,
        };

        const rsaPrivateKey = await importJWK(srcKeyAsPrivateJwk);

        const newJwt = await newJwtSigner.sign(rsaPrivateKey);

        res.status(200).json({
          access_token: newJwt,
          issued_token_type: TOKEN_TYPE_GA4GH_COMPACT,
          token_type: 'Bearer',
          expires_in: 60 * 60,
        });
      } catch (error) {
        console.log('Token exchange failed');

        if (error.response) {
          /*
           * The request was made and the server responded with a
           * status code that falls out of the range of 2xx
           */
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          /*
           * The request was made but no response was received, `error.request`
           * is an instance of XMLHttpRequest in the browser and an instance
           * of http.ClientRequest in Node.js
           */
          console.log(error.request);
        } else {
          // Something happened in setting up the request and triggered an Error
          console.log('Error', error.message);
        }
        console.log(error);
        res.status(500).json({ message: 'Code exchange failed', detail: error });
      }
    });
  }

  private async verifyIncomingCiLogon(jwt: string): Promise<any> {
    if (!jwt) throw new Error('A subject token must be provider');

    const JWKS = createRemoteJWKSet(new URL('https://test.cilogon.org/oauth2/certs'));

    const { payload } = await jwtVerify(jwt, JWKS, {
      algorithms: ['RS256', 'RS384', 'RS512'],
      issuer: 'https://test.cilogon.org',
    });

    return payload;
  }
}

/**
 * Consult the Didact internal database and return v2 controlled access visa containing all datasets
 * this subject is allowed into.
 *
 * @param subjectId
 * @return a JSON object that is a single v2 plain text visa
 */
async function getDidactCompactVisa(subjectId: string): Promise<any | null> {
  const visaAssertions = [];

  //for (const d of await applicationServiceInstance.findApprovedApplicationsInvolvedAsApplicant(subjectId)) visaAssertions.push(`c:${d}`);

  console.log(`Looking for approved datasets for ${subjectId} resulted in visa assertions '${visaAssertions}'`);

  return visaAssertions.length > 0
    ? makeCompactVisaSigned(keyDefinitions, VISA_DAC_ISSUER, 'rfc8032-7.1-test1', subjectId, { days: 90 }, visaAssertions)
    : null;
}

/**
 * Consult the Didact internal database and returned v1 controlled access visas for all datasets
 * this subject is allowed into.
 *
 * @param subjectId
 */
async function getDidactJwtVisas(subjectId: string): Promise<string[] | null> {
  const resultVisas: string[] = [];

  /*for (const d of await applicationServiceInstance.findApprovedApplicationsInvolvedAsApplicant(subjectId))
    resultVisas.push(
      await makeJwtVisaSigned(
        keyDefinitions,
        VISA_DAC_ISSUER,
        'rfc-rsa',
        subjectId,
        { days: 90 },
        {
          ga4gh_visa_v1: {
            type: 'ControlledAccessGrants',
            // this should be the date of approval..
            asserted: 1549632872,
            value: d,
            source: 'didact',
            by: 'dac',
          },
        },
      ),
    );*/

  if (resultVisas.length > 0) return resultVisas;

  return null;
}

const TRUSTED_RESEARCHER_GROUP = 'Trusted Researchers';

async function getNagimCompactVisa(subjectId: string, ldapPerson: any): Promise<any | null> {
  const visaAssertions: string[] = [];

  const groups = ldapPerson.isMemberOf || [];

  if (groups.includes(TRUSTED_RESEARCHER_GROUP)) visaAssertions.push('r:trusted_researcher');

  console.log(`Looking for trusted researcher status for ${subjectId} resulted in visa assertions '${visaAssertions}'`);

  return visaAssertions.length > 0
    ? makeCompactVisaSigned(keyDefinitions, VISA_BROKER_ISSUER, 'rfc8032-7.1-test1', subjectId, { days: 30 }, visaAssertions)
    : null;
}

async function getNagimJwtVisas(subjectId: string, ldapPerson: any): Promise<string[] | null> {
  const groups = ldapPerson.isMemberOf || [];

  if (groups.includes(TRUSTED_RESEARCHER_GROUP))
    return [
      await makeJwtVisaSigned(
        keyDefinitions,
        VISA_BROKER_ISSUER,
        'rfc-rsa',
        subjectId,
        { days: 90 },
        {
          ga4gh_visa_v1: {
            type: 'ResearcherStatus',
            // this theoretically should be the datetime when the person was put into the trusted research group - for the moment whatever..
            asserted: 1549680000,
            value: 'https://doi.org/10.1038/s41431-018-0219-y',
            // MCRI..
            source: 'https://ror.org/048fyec77',
            by: 'system',
          },
        },
      ),
    ];

  return null;
}

// grant_type
//       REQUIRED.  The value "urn:ietf:params:oauth:grant-type:token-
//       exchange" indicates that a token exchange is being performed.
//
//    resource
//       OPTIONAL.  A URI that indicates the target service or resource
//       where the client intends to use the requested security token.
//       This enables the authorization server to apply policy as
//       appropriate for the target, such as determining the type and
//       content of the token to be issued or if and how the token is to be
//       encrypted.  In many cases, a client will not have knowledge of the
//       logical organization of the systems with which it interacts and
//       will only know a URI of the service where it intends to use the
//       token.  The "resource" parameter allows the client to indicate to
//       the authorization server where it intends to use the issued token
//       by providing the location, typically as an https URL, in the token
//       exchange request in the same form that will be used to access that
//       resource.  The authorization server will typically have the
//       capability to map from a resource URI value to an appropriate
//       policy.  The value of the "resource" parameter MUST be an absolute
//       URI, as specified by Section 4.3 of [RFC3986], that MAY include a
//       query component and MUST NOT include a fragment component.
//       Multiple "resource" parameters may be used to indicate that the
//       issued token is intended to be used at the multiple resources
//       listed.  See [OAUTH-RESOURCE] for additional background and uses
//       of the "resource" parameter.
//
//    audience
//       OPTIONAL.  The logical name of the target service where the client
//       intends to use the requested security token.  This serves a
//       purpose similar to the "resource" parameter but with the client
//       providing a logical name for the target service.  Interpretation
//       of the name requires that the value be something that both the
//       client and the authorization server understand.  An OAuth client
//       identifier, a SAML entity identifier [OASIS.saml-core-2.0-os], and
//       an OpenID Connect Issuer Identifier [OpenID.Core] are examples of
//       things that might be used as "audience" parameter values.
//       However, "audience" values used with a given authorization server
//       must be unique within that server to ensure that they are properly
//       interpreted as the intended type of value.  Multiple "audience"
//       parameters may be used to indicate that the issued token is
//       intended to be used at the multiple audiences listed.  The
//       "audience" and "resource" parameters may be used together to
//       indicate multiple target services with a mix of logical names and
//       resource URIs.
//
//    scope
//       OPTIONAL.  A list of space-delimited, case-sensitive strings, as
//       defined in Section 3.3 of [RFC6749], that allow the client to
//       specify the desired scope of the requested security token in the
//       context of the service or resource where the token will be used.
//       The values and associated semantics of scope are service specific
//       and expected to be described in the relevant service
//       documentation.
//
//    requested_token_type
//       OPTIONAL.  An identifier, as described in Section 3, for the type
//       of the requested security token.  If the requested type is
//       unspecified, the issued token type is at the discretion of the
//       authorization server and may be dictated by knowledge of the
//       requirements of the service or resource indicated by the
//       "resource" or "audience" parameter.
//
//    subject_token
//       REQUIRED.  A security token that represents the identity of the
//       party on behalf of whom the request is being made.  Typically, the
//       subject of this token will be the subject of the security token
//       issued in response to the request.
//
//    subject_token_type
//       REQUIRED.  An identifier, as described in Section 3, that
//       indicates the type of the security token in the "subject_token"
//       parameter.
//
//    actor_token
//       OPTIONAL.  A security token that represents the identity of the
//       acting party.  Typically, this will be the party that is
//       authorized to use the requested security token and act on behalf
//       of the subject.
//
//    actor_token_type
//       An identifier, as described in Section 3, that indicates the type
//       of the security token in the "actor_token" parameter.  This is
//       REQUIRED when the "actor_token" parameter is present in the
//       request but MUST NOT be included otherwise.
