/**
 * Prerequisites:
 *
 * 1. Create a DynamoDB Table with following details:
 *        Partition Key: modelId
 *        TTL Attribute: expiresAt
 *        Three Global Secondary Indexes:
 *            GSI 1:
 *                Index Name: uidIndex
 *                Partition Key: uid
 *            GSI 2:
 *                Index Name: grantIdIndex
 *                Partition Key: grantId
 *            GSI 3:
 *                Index Name: userCodeIndex
 *                Partition Key: userCode
 *
 * 2. Put the Table's name in environment variable TABLE_NAME.
 *
 * 3. Your environment will need to have an AWS_REGION set.
 *
 * 4. If you are in AWS' compute environment, nothing more needs to be changed in code.
 *    You just need to give proper IAM permissions of DynamoDB Table.
 *    Required Permissions:
 *        dynamodb:GetItem
 *        dynamodb:ConditionCheckItem
 *        dynamodb:UpdateItem
 *        dynamodb:DeleteItem
 *        dynamodb:Query
 *        dynamodb:BatchWriteItem
 *    If you aren't in AWS' compute environment, you'll also need to configure SDK with proper credentials.
 *    @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/configuring-the-jssdk.html
 */

// Author: Sachin Shekhar <https://github.com/SachinShekhar>
// Mention @SachinShekhar in issues to ask questions about this code.
// Changes: updated to use newer AWS SDK

import { Adapter, AdapterPayload } from "oidc-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
  GetCommandInput,
  GetCommand,
  DeleteCommandInput,
  DeleteCommand,
  QueryCommand,
  QueryCommandInput,
  BatchWriteCommandInput,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { getMandatoryEnv } from "../app-env";

/**
 * A single-table Dynamo adapter for use by the Node OIDC provider (and ancillary
 * data used by the AAI Test Bed)
 */
export class DynamoDBAdapter implements Adapter {
  name: string;
  tableName: string;
  client: DynamoDBClient;

  /**
   * Construct an adapter for a certain type of data
   *
   * @param name the name of the type of data being adapted (Fixture, Grant, Session etc) - prefixes all dynamo partition keys
   */
  constructor(name: string) {
    this.name = name;

    // this gets set in the environment of the lambda to a CDK created table - but if running locally
    // will need to be set to an already created table (see .env)
    this.tableName = getMandatoryEnv("TABLE_NAME");

    // note: this needs an AWS_REGION set - which is fine when running in a lambda but will need it set
    // in the environment if running outside AWS (see .env)
    this.client = new DynamoDBClient({});
  }

  private static expiresInToExpiresAt(expiresIn?: number): number | null {
    return expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;
  }

  /*async createFixture(id: string, payload: FixturePayload, expiresIn?: number): Promise<void> {
    if (this.name != 'Fixture') throw new Error('Fixture methods can only be used on a Fixture adapter');

    try {
      const docClient = DynamoDBDocumentClient.from(this.client, { marshallOptions: { removeUndefinedValues: true } });

      const expiresAt = DynamoDBAdapter.expiresInToExpiresAt(expiresIn);

      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: { modelId: this.name + '-' + id },
        UpdateExpression: 'SET payload = :payload' + (expiresAt ? ', expiresAt = :expiresAt' : ''),
        ExpressionAttributeValues: {
          ':payload': payload,
          ...(expiresAt ? { ':expiresAt': expiresAt } : {}),
        },
      };

      await docClient.send(new UpdateCommand(params));
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findFixture(id: string): Promise<FixturePayload | undefined> {
    if (this.name != 'Fixture') throw new Error('Fixture methods can only be used on a Fixture adapter');

    try {
      const docClient = DynamoDBDocumentClient.from(this.client);

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: { modelId: this.name + '-' + id },
        ProjectionExpression: 'payload, expiresAt',
      };

      const result = <{ payload: FixturePayload; expiresAt?: number } | undefined>(await docClient.send(new GetCommand(params))).Item;

      // DynamoDB can take upto 48 hours to drop expired items, so a check is required
      if (!result || (result.expiresAt && Date.now() > result.expiresAt * 1000)) {
        return undefined;
      }

      return result.payload;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }*/

  async upsert(
    id: string,
    payload: AdapterPayload,
    expiresInSeconds?: number,
  ): Promise<void> {
    try {
      const docClient = DynamoDBDocumentClient.from(this.client, {
        marshallOptions: { removeUndefinedValues: true },
      });

      // DynamoDB can recognise TTL values only in seconds
      const expiresAt = expiresInSeconds
        ? Math.floor(Date.now() / 1000) + expiresInSeconds
        : null;

      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: { modelId: this.name + "-" + id },
        UpdateExpression:
          "SET payload = :payload" +
          (expiresAt ? ", expiresAt = :expiresAt" : "") +
          (payload.userCode ? ", userCode = :userCode" : "") +
          (payload.uid ? ", uid = :uid" : "") +
          (payload.grantId ? ", grantId = :grantId" : ""),
        ExpressionAttributeValues: {
          ":payload": payload,
          ...(expiresAt ? { ":expiresAt": expiresAt } : {}),
          ...(payload.userCode ? { ":userCode": payload.userCode } : {}),
          ...(payload.uid ? { ":uid": payload.uid } : {}),
          ...(payload.grantId ? { ":grantId": payload.grantId } : {}),
        },
      };

      await docClient.send(new UpdateCommand(params));
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async find(id: string): Promise<AdapterPayload | undefined> {
    console.log(`Finding ${id}`);

    try {
      const docClient = DynamoDBDocumentClient.from(this.client);

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: { modelId: this.name + "-" + id },
        ProjectionExpression: "payload, expiresAt",
      };

      const result = <
        { payload: AdapterPayload; expiresAt?: number } | undefined
      >(await docClient.send(new GetCommand(params))).Item;

      // DynamoDB can take upto 48 hours to drop expired items, so an explicit check is required
      if (
        !result ||
        (result.expiresAt && Date.now() > result.expiresAt * 1000)
      ) {
        return undefined;
      }

      console.log(`Found payload of ${JSON.stringify(result.payload)}`);

      return result.payload;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    try {
      const docClient = DynamoDBDocumentClient.from(this.client);

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: "userCodeIndex",
        KeyConditionExpression: "userCode = :userCode",
        ExpressionAttributeValues: {
          ":userCode": userCode,
        },
        Limit: 1,
        ProjectionExpression: "payload, expiresAt",
      };

      const result = <
        { payload: AdapterPayload; expiresAt?: number } | undefined
      >(await docClient.send(new QueryCommand(params))).Items?.[0];

      // DynamoDB can take upto 48 hours to drop expired items, so a check is required
      if (
        !result ||
        (result.expiresAt && Date.now() > result.expiresAt * 1000)
      ) {
        return undefined;
      }

      return result.payload;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    const docClient = DynamoDBDocumentClient.from(this.client);

    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: "uidIndex",
      KeyConditionExpression: "uid = :uid",
      ExpressionAttributeValues: {
        ":uid": uid,
      },
      Limit: 1,
      ProjectionExpression: "payload, expiresAt",
    };

    const result = <
      { payload: AdapterPayload; expiresAt?: number } | undefined
    >(await docClient.send(new QueryCommand(params))).Items?.[0];

    // DynamoDB can take upto 48 hours to drop expired items, so a check is required
    if (!result || (result.expiresAt && Date.now() > result.expiresAt * 1000)) {
      return undefined;
    }

    return result.payload;
  }

  async consume(id: string): Promise<void> {
    const docClient = DynamoDBDocumentClient.from(this.client);

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: { modelId: this.name + "-" + id },
      UpdateExpression: "SET #payload.#consumed = :value",
      ExpressionAttributeNames: {
        "#payload": "payload",
        "#consumed": "consumed",
      },
      ExpressionAttributeValues: {
        ":value": Math.floor(Date.now() / 1000),
      },
      ConditionExpression: "attribute_exists(modelId)",
    };

    await docClient.send(new UpdateCommand(params));
  }

  async destroy(id: string): Promise<void> {
    const docClient = DynamoDBDocumentClient.from(this.client);

    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: { modelId: this.name + "-" + id },
    };

    await docClient.send(new DeleteCommand(params));
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    const docClient = DynamoDBDocumentClient.from(this.client);

    let ExclusiveStartKey: any | undefined = undefined;

    do {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: "grantIdIndex",
        KeyConditionExpression: "grantId = :grantId",
        ExpressionAttributeValues: {
          ":grantId": grantId,
        },
        ProjectionExpression: "modelId",
        Limit: 25,
        ExclusiveStartKey,
      };

      const queryResult = await docClient.send(new QueryCommand(params));
      ExclusiveStartKey = queryResult.LastEvaluatedKey;

      const items = <{ modelId: string }[] | undefined>queryResult.Items;

      if (!items || !items.length) {
        return;
      }

      //TODO: restore func
      // const batchWriteParams: BatchWriteCommandInput = {
      //  RequestItems: {
      //    [this.tableName]: items.reduce((acc, item) => [...acc, { DeleteRequest: { Key: { modelId: item.modelId } } }], []),
      //  },
      //};

      //await docClient.send(new BatchWriteCommand(batchWriteParams));
    } while (ExclusiveStartKey);
  }
}
