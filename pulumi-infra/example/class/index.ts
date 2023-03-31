import { getResourceName } from '../../resource-name';
import Stack, { StackArgs } from '../../patterns/stack';
import LambdaApigatewayv2 from '../../patterns/lambda-apigatewayv2';
import SnsSubscriptionSqsLambda from '../../patterns/sns-subscription-sqs-lambda';
import apiHandler from '../../../src/apigateway-event-handler';
import sqsHandler from '../../../src/sqs-event-handler';

class ExampleStack extends Stack {
  public lambdaApigatewayv2: LambdaApigatewayv2;

  public snsSubscriptionSqsLambda: SnsSubscriptionSqsLambda;

  constructor(identifier: string, args: StackArgs) {
    super(identifier, args);
    this.lambdaApigatewayv2 = new LambdaApigatewayv2(
      getResourceName('hello1-class'),
      { lambdaArgs: { callback: apiHandler } },
      { parent: this }
    );
    this.snsSubscriptionSqsLambda = new SnsSubscriptionSqsLambda(
      getResourceName('subs1-class'),
      {
        lambdaArgs: { callback: sqsHandler },
        snsSubscriptionArgs: {
          topic: 'arn:aws:sns:us-east-1:944228615974:FakeOxyTopic',
          // filterPolicy: JSON.stringify({
          //   eventName: ['test'],
          // }),
        },
      },
      { parent: this }
    );
    this.output = {
      ...this.lambdaApigatewayv2.output,
    };
  }
}
const exampleStack = new ExampleStack(getResourceName('example-stack-class'), {
  providerArgs: {
    region: 'us-east-1',
    tags: {
      owner: 'owner',
      repo: 'https://github.com/',
      team: 'team_name',
    },
  },
});
export const { output } = exampleStack;
