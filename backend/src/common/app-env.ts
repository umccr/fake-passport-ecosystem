/**
 * We have a set of named environment variables that we use to bridge from
 * outer installation level settings (CloudFormation parameters) -> settings in the backend.
 * We use this as a central point for the definition of these names and attempt to add a
 * bit of "safety" to their use.
 */
export type AppEnvName =
  | "TABLE_NAME"
  | "DOMAIN_NAME"
  | "SEMANTIC_VERSION"
  | "BUILD_VERSION"
  | "NODE_ENV";

export function getMandatoryEnv(name: AppEnvName): string {
  const val = process.env[name];

  if (!val)
    throw new Error(
      `Was expecting a mandatory environment variable named ${name} to exist, but it was missing or empty`,
    );

  return val;
}
