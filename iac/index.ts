import { AaiTestBedSite } from "./constructs/aai-test-bed-site";
import { App, CfnParameter, Stack, StackProps } from "aws-cdk-lib";

class AaiTestBedStack extends Stack {
  constructor(parent: App, name: string, props: StackProps) {
    super(parent, name, props);

    // build number is passed in from the launching CLI context
    const build = this.node.tryGetContext("build");

    //
    // Site specific
    //

    const semanticVersionParam = new CfnParameter(this, "SemanticVersion", {
      type: "String",
      description: "The semantic version to assign to this deployment",
    });

    const deployedEnvironmentParam = new CfnParameter(
      this,
      "DeployedEnvironment",
      {
        type: "String",
        description:
          "The environment setting to use throughout backend (NODE_ENV) and frontend (EnvRelayProvider.deployedEnvironment)",
        allowedValues: ["production", "development"],
        default: "development",
      }
    );

    const lambdaRepoNameParam = new CfnParameter(this, "ECRName", {
      type: "String",
      description: `ECR repository name holding the lambda images for the site (must be in same account as deployment - must use the image tagged ${build})`,
    });

    const siteParameterGroup = {
      Label: { default: "Site Settings" },
      Parameters: [
        semanticVersionParam.logicalId,
        deployedEnvironmentParam.logicalId,
        lambdaRepoNameParam.logicalId,
      ],
    };

    //
    // ALB
    //

    const albCertificateArnParam = new CfnParameter(this, "AlbCertArn", {
      type: "String",
      description: "ALB certificate ARN (must cover <host>.<domain>)",
    });

    const albNameHostParam = new CfnParameter(this, "AlbNameHost", {
      type: "String",
      description:
        "ALB <host> (the host part of the ALB fully qualified name https://<host>.<domain>)",
    });

    const albNameDomainParam = new CfnParameter(this, "AlbNameDomain", {
      type: "String",
      description:
        "ALB <domain> (the domain part of the ALB fully qualified name https://<host>.<domain>)",
    });

    const albNameZoneIdParam = new CfnParameter(this, "AlbNameZoneId", {
      type: "String",
      description:
        "ALB domain zone id (must match <domain>, but can be left blank if creating DNS entries by hand)",
    });

    const albParameterGroup = {
      Label: { default: "ALB" },
      Parameters: [
        albCertificateArnParam.logicalId,
        albNameHostParam.logicalId,
        albNameDomainParam.logicalId,
        albNameZoneIdParam.logicalId,
      ],
    };

    // we need to construct a CFN metadata section that has interface->parameter groups
    // this is not supported natively by CDK, so hack it in a bit
    const meta: any = {};

    meta["AWS::CloudFormation::Interface"] = {
      ParameterGroups: [
        siteParameterGroup,
        albParameterGroup,
      ],
    };
    this.templateOptions.metadata = meta;
    this.templateOptions.description = `${name} build #${build}`;

    new AaiTestBedSite(this, "Web", {
      semanticVersionParam,
      deployedEnvironmentParam,
      lambdaRepoNameParam,
      albCertificateArnParam,
      albNameHostParam,
      albNameDomainParam,
      albNameZoneIdParam,
      build,
    });
  }
}

const STACK_BASE_NAME = "agha-aai-test-bed";

const app = new App();

if (process.env.CI === "true") {
  // in the CI process, we are building a environment agnostic CFN script
  new AaiTestBedStack(app, STACK_BASE_NAME, {});
} else {
  // otherwise, we are in a dev environment and building a per-dev stack for actual deployment
  // we need to determine a 'per-dev' name so that our stacks don't clash
  if (!process.env.UMCCR_DEVELOPER) {
    throw new Error(
      "Something needs to set the env variable UMCCR_DEVELOPER when deploying in dev scenarios"
    );
  }

  const dev = process.env.UMCCR_DEVELOPER;

  new AaiTestBedStack(app, [STACK_BASE_NAME, dev].join("-"), {
    env: {
      region: "ap-southeast-2",
      // the dev stack can only be deployed directly by CDK into the dev account
      // in all other scenarios we are synthesising a CFN for general use
      account: "843407916570",
    },
  });
}

app.synth();
