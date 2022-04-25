import {AppControl}    from "./app-control/app-control";
import {setupTestData} from "./testing/setup-test-data";

console.log('Bootstrapping local server for the control API');
console.log('Creating Express app');

const appControl = new AppControl();
setupTestData().then(() => {
    appControl.listen( 3454, () => {
        console.log('Started control on 3454');
    });
})
