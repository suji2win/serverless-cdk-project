import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ServerlessCdkProjectStack extends cdk.Stack {

  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {

    super(scope, id, props);

    // --------------------------------------------------
    // DynamoDB Table
    // --------------------------------------------------

    const table = new dynamodb.Table(this, "StudentItemsTable", {

      tableName: "StudentItems",

      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING
      },

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      removalPolicy: cdk.RemovalPolicy.DESTROY
    });


    // --------------------------------------------------
    // Lambda Function
    // --------------------------------------------------

    const itemsLambda = new nodejs.NodejsFunction(
      this,
      "ItemsLambda",
      {
        runtime: lambda.Runtime.NODEJS_22_X,

        architecture: lambda.Architecture.X86_64,

        entry: "lambda/items.ts",

        handler: "handler",

        memorySize: 256,

        timeout: cdk.Duration.seconds(10),

        environment: {
          TABLE_NAME: table.tableName
      }
    });

    // --------------------------------------------------
    // DynamoDB IAM Permissions
    // --------------------------------------------------

    table.grantReadWriteData(itemsLambda);


    // --------------------------------------------------
    // API Gateway REST API
    // --------------------------------------------------

    const api = new apigateway.RestApi(this, "ServerlessRestApi", {

      restApiName: "Serverless Items API",

      description:
        "REST API for managing StudentItems",

      deployOptions: {
        stageName: "prod"
      }
    });


    // --------------------------------------------------
    // Lambda Integration
    // --------------------------------------------------

    const lambdaIntegration =
      new apigateway.LambdaIntegration(itemsLambda);


    // --------------------------------------------------
    // /items
    // --------------------------------------------------

    const items = api.root.addResource("items");

    items.addMethod(
      "GET",
      lambdaIntegration
    );

    items.addMethod(
      "POST",
      lambdaIntegration
    );


    // --------------------------------------------------
    // /items/{id}
    // --------------------------------------------------

    const item = items.addResource("{id}");

    item.addMethod(
      "GET",
      lambdaIntegration
    );

    item.addMethod(
      "PUT",
      lambdaIntegration
    );

    item.addMethod(
      "DELETE",
      lambdaIntegration
    );


    // --------------------------------------------------
    // Outputs
    // --------------------------------------------------

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL"
    });

    new cdk.CfnOutput(this, "DynamoDBTableName", {
      value: table.tableName,
      description: "DynamoDB table name"
    });

    new cdk.CfnOutput(this, "LambdaFunctionName", {
      value: itemsLambda.functionName,
      description: "Lambda function name"
    });
  }
}
