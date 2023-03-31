import SnsSubscriptionSqsLambda from '../../patterns/sns-subscription-sqs-lambda';
import { getResourceName } from '../../resource-name';
import Stack from '../../patterns/stack';
import LambdaApigatewayv2 from '../../patterns/lambda-apigatewayv2';
import apiHandler from '../../../src/apigateway-event-handler';
import sqsHandler from '../../../src/sqs-event-handler';

const stack = new Stack(getResourceName('example-stack-function'), {
  providerArgs: {
    region: 'us-east-1',
    tags: {
      owner: 'owner',
      repo: 'https://github.com/',
      team: 'team_name',
    },
  },
});
const lambda = new LambdaApigatewayv2(
  getResourceName('hello1-function'),
  {
    lambdaArgs: { callback: apiHandler },
    apigatewayv2Args: {
      routeKey: 'POST /path',
    },
  },
  { parent: stack }
);
new SnsSubscriptionSqsLambda(
  getResourceName('subs1-function'),
  {
    lambdaArgs: { callback: sqsHandler },
    snsSubscriptionArgs: {
      topic: 'arn:aws:sns:us-east-1:944228615974:FakeOxyTopic',
      // filterPolicy: JSON.stringify({
      //   eventName: ['test'],
      // }),
    },
  },
  { parent: stack }
);
export const { output } = lambda;
