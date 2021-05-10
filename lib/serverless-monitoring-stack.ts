import * as cdk from '@aws-cdk/core';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as s3 from '@aws-cdk/aws-s3';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as path from 'path';

export class ServerlessMonitoringStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'UploadBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const table = new dynamodb.Table(this, 'DocumentsTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      }
    }); 

    const service = new NodejsFunction(this, 'TestFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_DAY,
      timeout: cdk.Duration.seconds(10),
      entry: path.join(__dirname, '../lambda/index.js')
    });

    bucket.grantReadWrite(service);
    table.grantFullAccess(service);

    service.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['lambda:GetAccountSettings'],
      }),
    );

    service.addEnvironment('DYNAMO_DB_TABLE', table.tableName);
    service.addEnvironment('S3_BUCKET', bucket.bucketName);

    const serviceTarget = new targets.LambdaFunction(service);

    new events.Rule(this, 'ScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      targets: [serviceTarget]
    });

  }
}
