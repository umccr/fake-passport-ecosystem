export function setupLocalstack() {
  process.env = Object.assign(process.env, { AWS_ACCESS_KEY_ID: 'dummy-key', AWS_SECRET_ACCESS_KEY: 'dummy-secret' });

  /*AWS.config.update({
    dynamodb: {
      region: 'ap-southeast-2',
      endpoint: 'http://localstack:4566',
    },
  }); */
}
