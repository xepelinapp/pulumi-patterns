import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import Lambda, { LambdaArgs } from './lambda';

export type LambdaApigatewayv2Args = {
  lambdaArgs: LambdaArgs<APIGatewayProxyEvent, APIGatewayProxyResult>;
  apigatewayv2Args?: Omit<
    aws.apigatewayv2.ApiArgs,
    'name' | 'target' | 'protocolType' | 'routeKey'
  > & { routeKey?: string };
};

class LambdaApigatewayv2 extends pulumi.ComponentResource {
  public readonly output: Record<string, unknown>;

  public readonly apigatewayv2Api: aws.apigatewayv2.Api;

  public readonly lambda: Lambda<APIGatewayProxyEvent, APIGatewayProxyResult>;

  constructor(
    name: string,
    args: LambdaApigatewayv2Args,
    opts: pulumi.ComponentResourceOptions & { parent: pulumi.Resource }
  ) {
    super('pkg:index:LambdaApigatewayv2', `${name}-lambda-apigwv2`, {}, opts);
    const { lambdaArgs } = args;
    const routeKey = args?.apigatewayv2Args?.routeKey || '$default';
    this.lambda = new Lambda<APIGatewayProxyEvent, APIGatewayProxyResult>(
      `${name}-lambda-fn`,
      lambdaArgs,
      { parent: this }
    );
    const apiGatewayName = `${name}-apigwv2`;
    this.apigatewayv2Api = new aws.apigatewayv2.Api(
      apiGatewayName,
      {
        ...args?.apigatewayv2Args,
        name: apiGatewayName,
        target: this.lambda.function.invokeArn,
        protocolType: 'HTTP',
        routeKey,
      },
      { parent: this }
    );
    new aws.lambda.Permission(
      `${name}-permission`,
      {
        action: 'lambda:InvokeFunction',
        principal: 'apigateway.amazonaws.com',
        function: this.lambda.function,
        sourceArn: pulumi.interpolate`${
          this.apigatewayv2Api.executionArn
        }/*/${routeKey.replace(' ', '')}`,
      },
      { parent: this }
    );
    this.output = {
      url: this.apigatewayv2Api.apiEndpoint,
    };
  }
}
export default LambdaApigatewayv2;
