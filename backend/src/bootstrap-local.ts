import {AppControl}    from './app-control/app-control';
import {getFixture}    from "./common/business/fixture-payload";
import {AppBroker}     from "./app-broker/app-broker";
import {setupTestData} from "./testing/setup-test-data";

// the development node bootstrap entrypoint
// this entrypoint is used for running the backend locally on a dev machine - but must
// still be done with AWS env variables set for permissions into the dev AWS

// console.log('Bootstrapping local server (broker and control)');
// console.log('Creating fresh test data');
//
// setupTestData().then(async (id: string) => {
//   console.log('Creating Express app');
//
//   const fixture = await getFixture(id);
//
//   const appBroker = new AppBroker(id, "not.used", fixture, true);
//
//   // THIS IS NOT THE ENTRYPOINT FOR USE IN PRODUCTION WITHIN THE AWS LAMBDA ENVIRONMENT
//   appBroker.listen(3000, () => {
//     console.log('Started local broker on 3000');
//
//     // until we start using control no need to start it
//     const appControl = new AppControl();
//
//     appControl.listen(3001, () => {
//       console.log('Started control on 3001');
//     });
//   });
// });

// the development node bootstrap entrypoint
// this entrypoint is used for running the backend locally on a dev machine - but must
// still be done with AWS env variables set for permissions into the dev AWS

console.log('Bootstrapping local server broker');
console.log('Creating fresh test data');
console.log('Creating Express app');

const args = process.argv.slice(2)

console.log(`Using valid fixture ${args[0]}}`)

const fixture = await getFixture(args[0]);

const appBroker = new AppBroker(args[0], "not.used", fixture, true);

// THIS IS NOT THE ENTRYPOINT FOR USE IN PRODUCTION WITHIN THE AWS LAMBDA ENVIRONMENT
appBroker.listen(3455, () => {
    console.log('Started local broker on 3455');
})
