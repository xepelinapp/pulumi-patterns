import { SQSEvent } from 'aws-lambda';
import { LambdaHandler } from 'pulumi-infra/patterns/lambda';

export const handler: LambdaHandler<SQSEvent, string> = async (event) => {
  const records = JSON.stringify(event.Records);
  // eslint-disable-next-line no-console
  console.log({ records });

  return 'success';
};
export default handler;
