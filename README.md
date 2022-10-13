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

#### Create local dynamo db table using Docker

Make sure you have Docker installed, and run:

```shell
docker run --name aai-dynamodb -p 8000:8000 amazon/dynamodb-local
```

Confirm that it is running:
```
docker ps
```

Set up your AWS cli, then create a table by running: 

```shell
aws dynamodb create-table \
   --table-name agha-aai-test-bed-local-dev \
   --attribute-definitions AttributeName=modelId,AttributeType=S \
   --key-schema AttributeName=modelId,KeyType=HASH \
   --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
   --endpoint-url http://localhost:8000
```

Set up the GSI's by running:

```shell
aws dynamodb update-table \
--table-name agha-aai-test-bed-local-dev \
--attribute-definitions AttributeName=modelId,AttributeType=S AttributeName=uid,AttributeType=S \
    --global-secondary-index-updates \
     '{"Create":{"IndexName":"uidIndex","KeySchema":[{"AttributeName":"uid","KeyType":"HASH"}],"ProvisionedThroughput":{"ReadCapacityUnits":10,"WriteCapacityUnits":5},"Projection":{"ProjectionType":"ALL"}}}' --endpoint-url http://localhost:8000
```

```shell
aws dynamodb update-table \
--table-name agha-aai-test-bed-local-dev \
--attribute-definitions AttributeName=modelId,AttributeType=S \
--global-secondary-index-updates \
 '{"Create":{"IndexName":"grantIdIndex","KeySchema":[{"AttributeName":"modelId","KeyType":"HASH"}],"ProvisionedThroughput":{"ReadCapacityUnits":10,"WriteCapacityUnits":5},"Projection":{"ProjectionType":"ALL"}}}' --endpoint-url http://localhost:8000
```

```shell
aws dynamodb update-table \
--table-name agha-aai-test-bed-local-dev \
--attribute-definitions AttributeName=modelId,AttributeType=S \
--global-secondary-index-updates \
 '{"Create":{"IndexName":"userCodeIndex","KeySchema":[{"AttributeName":"modelId","KeyType":"HASH"}],"ProvisionedThroughput":{"ReadCapacityUnits":10,"WriteCapacityUnits":5},"Projection":{"ProjectionType":"ALL"}}}' --endpoint-url http://localhost:8000
```

In `setup-test-data.ts`, update the config of the DynamoDb client to: 

```shell
const dbClient = new DynamoDBClient({region: 'ap-southeast-2', endpoint: 'http://localhost:8000'}); // or whatever region you are using
```

Similarly, in `oidc-provider-dynamodb-adapter.ts`, do the same.

```shell
this.client = new DynamoDBClient({region: 'ap-southeast-2', endpoint: 'http://localhost:8000'});
```

Start the backend

```shell
cd backend
npm install
npm run dev
```

Start the frontend

```shell
cd frontend
pipenv install
pipenv run python flow_browser.py
// or
pipenv run python flow_quiet.py
```

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

