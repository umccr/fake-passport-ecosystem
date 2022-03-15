# agha-aai-test-bed

A framework for setting up passport/visa test suites. Basically an AWS deployable
set of endpoints - that can programatically construct *other* endpoints for the
purposes of doing OIDC/passport flows.


## Local Development

### Create a dynamo table

The test bed uses a single dynamo table for storing all state information
from the OIDC flow, as well as configuration settings for test fixtures.

To run locally, an equivalent dynamo table needs to be created manually.

Due to a deliberate check in the setup function, the table name MUST have the
string "AAI" and "Local" (any case) in the name.

See `oidc-provider-dynamodb-adapter.ts` for the PK and GSI definitions.

### Run

Whilst the real deployed code is aimed at dynamically constructing domain names etc - we
cannot do this for local development. Instead when run locally the Node start up
will create test data for

a broker running on localhost:3000
a control node running on localhost:3001

See `bootstrap-local-*.ts` for ways of setting up scenarios particular to your
development.


## AWS Deployment

### Build

See `Makefile`.

This is currently broken.

