import { Construct } from "constructs";
import {
  CfnApi,
  CfnApiMapping,
  CfnDomainName,
} from "aws-cdk-lib/aws-apigatewayv2";
import { Function } from "aws-cdk-lib/aws-lambda";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayv2DomainProperties } from "aws-cdk-lib/aws-route53-targets";
import { LogGroup } from "aws-cdk-lib/aws-logs";

export type MultiTargetLoadBalancerProps = {
  // the ARN for a wildcard (or precise) certificate that matches
  // <nameHost>.<nameDomain>
  certificateArn: string;

  // the first part of the FQDN for the site
  nameHost: string;

  // the rest of the name of the FQDN for the site
  nameDomain: string;

  // the Route 53 zone, matching <nameDomain> in which we will be placing entries
  nameZoneId: string;

  // backend function for site
  targetDefault: Function;
};

/**
 */
export class WebsiteApiGateway extends Construct {
  public readonly apiGateway: CfnApi;
  public readonly fqdn: string;

  constructor(
    parent: Construct,
    name: string,
    props: MultiTargetLoadBalancerProps,
  ) {
    super(parent, name);

    this.fqdn = props.nameHost + "." + props.nameDomain;

    // const logGroup = new LogGroup(this, "ApiGatewayAccessLogs");

    this.apiGateway = new CfnApi(this, "Api", {
      name: this.fqdn,
      protocolType: "HTTP",
      target: props.targetDefault.functionArn,
      corsConfiguration: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "PUT", "POST"],
        allowHeaders: ["*"],
        allowCredentials: false,
      },
    });

    // register a custom domain to overlay the api gw chosen endpoint
    const dn = new CfnDomainName(this, "ApiDomain", {
      domainName: this.fqdn,
      domainNameConfigurations: [
        {
          certificateArn: props.certificateArn,
          endpointType: "REGIONAL",
        },
      ],
    });

    // we always need to add this in or else the domain name stuff can get ahead
    // of the actual API creation
    dn.addDependency(this.apiGateway);

    const albZone = HostedZone.fromHostedZoneAttributes(this, "AlbZone", {
      hostedZoneId: props.nameZoneId,
      zoneName: props.nameDomain,
    });

    const recordTarget = RecordTarget.fromAlias(
      new ApiGatewayv2DomainProperties(
        dn.attrRegionalDomainName,
        dn.attrRegionalHostedZoneId,
      ),
    );

    const albDns = new ARecord(this, "AlbAliasRecord", {
      zone: albZone,
      recordName: props.nameHost,
      target: recordTarget,
    });

    // ok - the mapping always causes trouble - I think that is has an explicit
    // dependency already on apiGateway and dn - but we get random failures
    // to create the stack
    // WebBrokerApiGatewayMapping93BD2258	CREATE_FAILED	Invalid domain name identifier specified
    // which is a classic example of the mapping being attempted before the
    // domain name record is attached to the API gateway
    // so anyhow, we explicitly mention the dependencies here..
    const mappings = new CfnApiMapping(this, "Mapping", {
      apiId: this.apiGateway.ref,
      domainName: dn.domainName,
      stage: "$default",
    });
    mappings.addDependency(this.apiGateway);
    mappings.addDependency(dn);
  }
}
