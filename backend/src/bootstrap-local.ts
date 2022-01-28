import { setupTestData } from './testing/setup-test-data';
import { AppBroker } from './app-broker';
import { AppControl } from './app-control';
import { broker1 } from './bootstrap-local-samples';

// the development node bootstrap entrypoint
// this entrypoint is used for running the backend locally on a dev machine - but must
// still be done with AWS env variables set for permissions into the dev AWS

console.log('Bootstrapping local server');
console.log('Creating fresh test data');

setupTestData(true).then(async () => {
  // note that these env variables need to match up with those set in the real IaC stack
  console.log('Creating Express app');

  const appBroker = new AppBroker('broker', broker1, true);

  // THIS IS NOT THE ENTRYPOINT FOR USE IN PRODUCTION WITHIN THE AWS LAMBDA ENVIRONMENT
  appBroker.listen(3000, () => {
    console.log('Started broker1 on 3000');

    const appControl = new AppControl();

    appControl.listen(3001, () => {
      console.log('Started control on 3001');
    });
  });
});
