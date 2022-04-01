import { Duration, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  EcrImageCode,
  Handler,
  Runtime,
  Function,
  FunctionProps,
} from "aws-cdk-lib/aws-lambda";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LambdaTarget } from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import {
  Charset,
  LogLevel,
  NodejsFunction,
  OutputFormat,
  SourceMapMode,
} from "aws-cdk-lib/aws-lambda-nodejs";

/// THIS WAS AN EXPERIMENT - IT LOOKS USEFUL BUT IS STUCK ON BUG
/// https://github.com/evanw/esbuild/issues/1944
/// WAITING FOR FIX ON THAT

interface Props {
  /**
   * The role to give the executing lambda (use helper generateLambdaRole())
   */
  lambdaRole?: Role;

  /**
   * The optional override of the default lambda memory size
   */
  memorySize?: number;

  /**
   * The optional override of the default lambda maximum duration
   */
  duration?: Duration;

  // environment that is given to the lambda
  environmentVariables?: { [parameter: string]: string };
}

/**
 * Construct a Function stored as an ECR image.
 */
export class NodeJsLocalLambdaFunction extends Construct {
  public readonly function: Function;

  constructor(parent: Construct, name: string, props: Props) {
    super(parent, name);

    this.function = new NodejsFunction(this, "FunctionNodeJs", {
      memorySize: props.memorySize,
      timeout: props.duration,
      role: props.lambdaRole,
      entry: "../backend/src/bootstrap-lambda.ts",
      environment: props.environmentVariables,
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: SourceMapMode.INLINE,
        sourcesContent: false,
        charset: Charset.UTF8,
        format: OutputFormat.ESM,
        target: "es2020",
        //loader: {
        //    '.png': 'dataurl',
        //},
        // substitutions *during* bundling
        define: {
          "process.env.API_KEY": JSON.stringify("xxx-xxxx-xxx"),
          "process.env.PRODUCTION": JSON.stringify(true),
          "process.env.NUMBER": JSON.stringify(123),
        },
        logLevel: LogLevel.WARNING,
        keepNames: true,
        metafile: true,
        // this is a workaround for https://github.com/evanw/esbuild/issues/1944
        // would be good if we got rid of it at some point
        banner: [
          `import { createRequire as topLevelCreateRequire } from 'module'; `,
          `const require = topLevelCreateRequire(import.meta.url); `,
        ].join(" "),
      },
    });

    // we need to allow the lambda to be invoked by API gw
    // it is possible we should tighten the Condition on this to only allow
    // our specific API gw
    const principal = new ServicePrincipal("apigateway.amazonaws.com");
    this.function.grantInvoke(principal);
  }

  public functionAsLambdaTarget(): LambdaTarget {
    return new LambdaTarget(this.function);
  }

  /**
   * A helper function for create roles that are acceptable as Lambda executors.
   *
   * @param c
   * @param id
   * @param permissions
   */
  public static generateLambdaRole(
    c: Construct,
    id: string,
    permissions: string[]
  ): Role {
    if (!permissions.includes("service-role/AWSLambdaBasicExecutionRole")) {
      permissions.push("service-role/AWSLambdaBasicExecutionRole");
    }

    const lambdaRole = new Role(c, id, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    permissions.map((permission) => {
      lambdaRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName(permission)
      );
    });

    return lambdaRole;
  }
}
