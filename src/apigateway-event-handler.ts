import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaHandler } from 'pulumi-infra/patterns/lambda';

export const handler: LambdaHandler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  const body = JSON.parse(event.body || '{}');
  // eslint-disable-next-line no-console
  console.log({ body });

  return {
    statusCode: 200,
    body: JSON.stringify({
      affirmation: "Nice job, you've done it! :D",
      requestBodyEcho: body,
    }),
  };
};
export default handler;
