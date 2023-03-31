import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export type LambdaHandler<E, R> = aws.lambda.Callback<E, R>;
export type LambdaArgs<E, R> = Omit<
  aws.lambda.CallbackFunctionArgs<E, R>,
  'name'
> & {
  retentionInDays?: number;
};

class Lambda<E, R> extends pulumi.ComponentResource {
  public readonly output: Record<string, unknown>;

  public readonly function: aws.lambda.CallbackFunction<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  >;

  public readonly logGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    args: LambdaArgs<E, R>,
    opts: pulumi.ComponentResourceOptions & { parent: pulumi.Resource }
  ) {
    super('pkg:index:Lambda', `${name}-lambda`, {}, opts);
    this.function = new aws.lambda.CallbackFunction(
      name,
      {
        ...args,
        name,
        runtime: args?.runtime || aws.lambda.Runtime.NodeJS16dX,
      },
      { parent: this }
    );
    const logGroupName = `/aws/lambda/${name}`;
    this.logGroup = new aws.cloudwatch.LogGroup(
      logGroupName,
      {
        name: logGroupName,
        retentionInDays: args?.retentionInDays || 14,
      },
      { parent: this }
    );
    new aws.lambda.Permission(
      `${name}-log-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: this.function,
        principal: 'logs.amazonaws.com',
        sourceArn: this.logGroup.arn,
      },
      { parent: this }
    );
  }
}
export default Lambda;
