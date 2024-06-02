# GA4GH Fake Passport Ecosystem

A deployable passport ecosystem with fake brokers, visa issuers and
users. Can be used for simulations and testing.

## Cloud Deployment

```
make deploy
```

(currently this is set up only for UMCCR - WIP)

## Local Development

### Create a dynamo table

The system uses a single dynamo table for storing all state information
from the OIDC flow.

To run locally, an equivalent dynamo table needs to be created manually.

Due to a deliberate check in the setup function, the table name MUST have the
string "AAI" and "Local" (any case) in the name.

See `oidc-provider-dynamodb-adapter.ts` for the PK and GSI definitions.
