import {Duration, Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {EcrImageCode, Handler, Runtime, Function, FunctionProps} from "aws-cdk-lib/aws-lambda";
import {Repository} from "aws-cdk-lib/aws-ecr";
import {ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {LambdaTarget} from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";

interface Props {
    /**
     * The location of the lambda code in ECR - this must be in the same account as the deployed lambda
     */
    lambdaRepoNameParam: string;

    /**
     * The tag of the lambda code in ECR
     */
    lambdaRepoTag: string;

    /**
     * The docker CMD to invoke this lambda on function execution
     */
    lambdaCmd: string[];

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
export class EcrBasedLambdaFunction extends Construct {
    public readonly function: Function;

    constructor(parent: Construct, name: string, props: Props) {
        super(parent, name);

        const ecrImage = EcrImageCode.fromEcrImage(
            Repository.fromRepositoryName(
                this,
                "Ecr",
                props.lambdaRepoNameParam
            ),
            {
                tag: props.lambdaRepoTag,
                cmd: props.lambdaCmd,
            }
        );
        
        this.function = new Function(this, "Function", {
            memorySize: props.memorySize,
            timeout: props.duration,
            role: props.lambdaRole,
            code: ecrImage,
            runtime: Runtime.FROM_IMAGE,
            handler: Handler.FROM_IMAGE,
            environment: props.environmentVariables,
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
    public static generateLambdaRole(c: Construct, id: string, permissions: string[]): Role {

        if(!permissions.includes("service-role/AWSLambdaBasicExecutionRole")) {
            permissions.push("service-role/AWSLambdaBasicExecutionRole");
        }

        const lambdaRole = new Role(c, id, {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
          });

          permissions.map(permission => {
            lambdaRole.addManagedPolicy(
                ManagedPolicy.fromAwsManagedPolicyName(
                  permission
                )
              );
          })
      
          return lambdaRole;
    }
}
