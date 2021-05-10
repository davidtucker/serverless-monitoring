
import * as AWS from 'aws-sdk';

import { getLogger } from 'lambda-micro';

// Import the X-Ray SDK
import AWSXRay from 'aws-xray-sdk';

// Capture a Specific AWS client
const lambda = AWSXRay.captureAWSClient(new AWS.Lambda());
const s3 = AWSXRay.captureAWSClient(new AWS.S3());
const dynamoDB = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamoDB.service);
console.

exports.handler = async (event, context) => {
  const time = new Date().getTime();

  // Write event to S3
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: `${time}.json`,
    Body: JSON.stringify(event),
    ContentType: 'application/json',
  };
  await s3.putObject(s3Params).promise();

  // Write event to DynamoDB
  const dbParams = {
    TableName: process.env.DYNAMO_DB_TABLE,
    Item: {
      PK: time.toString(),
      Event: event
    },
    ReturnValues: 'NONE',
  };
  await dynamoDB.put(dbParams).promise();

  // Make request to the Lambda service
  const logger = getLogger(event, context);
  const permissions = await lambda.getAccountSettings().promise();
  logger.info({ permissions });

  return;
};
