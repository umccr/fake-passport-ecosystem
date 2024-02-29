# agha-aai-test-bed

A framework for setting up passport/visa test suites. Basically an AWS deployable
set of endpoints for the purposes of demonstrating GA4GH passport/visa flows.


## Local Development

### Create a dynamo table

The test bed uses a single dynamo table for storing all state information
from the OIDC flow.

To run locally, an equivalent dynamo table needs to be created manually.

Due to a deliberate check in the setup function, the table name MUST have the
string "AAI" and "Local" (any case) in the name.

See `oidc-provider-dynamodb-adapter.ts` for the PK and GSI definitions.
