import {CfnParameter, Duration, RemovalPolicy} from "aws-cdk-lib";
import {AttributeType, BillingMode, ProjectionType, Table,} from "aws-cdk-lib/aws-dynamodb";
import {Construct} from "constructs";
import {EcrBasedLambdaFunction} from "./ecr-based-lambda-function";
import {AppEnvName} from "../../backend/src/common/app-env";
import {WebsiteApiGateway} from "./website-api-gateway";
import {NodeJsLocalLambdaFunction} from "./nodejs-local-lambda-function";

interface Props {
  semanticVersionParam: CfnParameter;
  deployedEnvironmentParam: CfnParameter;
  lambdaRepoNameParam: CfnParameter;

  albCertificateArnParam: CfnParameter;
  albNameHostParam: CfnParameter;
  albNameDomainParam: CfnParameter;
  albNameZoneIdParam: CfnParameter;

  build: string;
}

/**
 * A site that exposes various AAI test bed functionality.
 */
export class AaiTestBedSite extends Construct {
  constructor(parent: Construct, name: string, props: Props) {
    super(parent, name);

    const oidcProviderTable = this.addOidcProviderTable()

    const htmlFunctionRole = EcrBasedLambdaFunction.generateLambdaRole(
      this,
      "HtmlFunctionRole",
      []
    );

    oidcProviderTable.grantReadWriteData(htmlFunctionRole);

    // because it is vital that the names we use here for env variables are consistent into the backends
    // we use a shared type definition AppEnvName
    const envs: { [name in AppEnvName]: string } = {
      BUILD_VERSION: props.build,
      SEMANTIC_VERSION: props.semanticVersionParam.valueAsString,
      NODE_ENV: props.deployedEnvironmentParam.valueAsString,
      TABLE_NAME: oidcProviderTable.tableName,
      DOMAIN_NAME: props.albNameDomainParam.valueAsString
    };

    const functionConstruct = new EcrBasedLambdaFunction(this, "HtmlFunction", {
      lambdaRole: htmlFunctionRole,
      lambdaRepoNameParam: props.lambdaRepoNameParam.valueAsString,
      lambdaCmd: ["bootstrap-lambda.handler"],
      lambdaRepoTag: props.build,
      environmentVariables: envs,
      duration: Duration.minutes(1),
      memorySize: 2048
    });

    // we will pivot to this when a bug in esbuild is fixed
    //const functionConstruct = new NodeJsLocalLambdaFunction(this, "HtmlFunction", {
    //  lambdaRole: htmlFunctionRole,
    //  environmentVariables: envs,
    //  duration: Duration.minutes(1),
    //});

    const apiGateway = new WebsiteApiGateway(this, "ApiGateway", {
      certificateArn: props.albCertificateArnParam.valueAsString,
      nameHost: props.albNameHostParam.valueAsString,
      nameDomain: props.albNameDomainParam.valueAsString,
      nameZoneId: props.albNameZoneIdParam.valueAsString,
      targetDefault: functionConstruct.function,
    });
  }

  /**
   * Add in any dynamodb table or other data storage.
   *
   * See oidc-provider-dynamodb-adapter for the table shape.
   * @private
   */
  private addOidcProviderTable(): Table {
    const t = new Table(this, "OidcProviderTable", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "modelId", type: AttributeType.STRING },
      timeToLiveAttribute: 'expiresAt'
    });

    t.addGlobalSecondaryIndex({
      indexName: "uidIndex",
      partitionKey: { name: "uid", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    t.addGlobalSecondaryIndex({
      indexName: "grantIdIndex",
      partitionKey: { name: "grantId", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    t.addGlobalSecondaryIndex({
      indexName: "userCodeIndex",
      partitionKey: { name: "userCode", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    return t;
  }
}
