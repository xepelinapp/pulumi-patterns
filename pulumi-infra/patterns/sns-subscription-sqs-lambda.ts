import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { SQSEvent } from 'aws-lambda';

import Lambda, { LambdaArgs } from './lambda';

export type SnsSubscriptionSqsLambdaArgs = {
  lambdaArgs: LambdaArgs<SQSEvent, unknown>;
  snsSubscriptionArgs: Omit<
    aws.sns.TopicSubscriptionArgs,
    'protocol' | 'endpoint'
  >;
  sqsQueuArgs?: Omit<aws.sqs.QueueArgs, 'redrivePolicy' | 'name'>;
  sqsDeadLetterQueuQueueArgs?: Omit<
    aws.sqs.QueueArgs,
    'redrivePolicy' | 'name' | 'topic'
  > & {
    maxReceiveCount?: number;
  };
};

//not finished
class SnsSubscriptionSqsLambda extends pulumi.ComponentResource {
  public readonly output: Record<string, unknown>;

  public readonly snsTopic: aws.sns.Topic;

  public readonly encryptionKey?: aws.kms.Key;

  public readonly lambda: Lambda<SQSEvent, unknown>;

  public readonly snsSubscription: aws.sns.TopicSubscription;

  public readonly sqsQueue: aws.sqs.Queue;

  public readonly deadLetterQueue: aws.sqs.Queue;

  constructor(
    name: string,
    args: SnsSubscriptionSqsLambdaArgs,
    opts: pulumi.ComponentResourceOptions & { parent: pulumi.Resource }
  ) {
    super(
      'pkg:index:SnsSubscriptionSqsLambda',
      `${name}-sns-sqs-lambda`,
      {},
      opts
    );
    const { lambdaArgs, snsSubscriptionArgs } = args;
    this.lambda = new Lambda<SQSEvent, unknown>(
      `${name}-lambda-fn`,
      lambdaArgs,
      { parent: this }
    );
    // this.snsTopic = this.buildSNSTopicFromARN(name, args.snsSubscriptionArgs);
    const dlQueuName = `${name}-dl-queue`;
    this.deadLetterQueue = new aws.sqs.Queue(
      dlQueuName,
      {
        ...args?.sqsDeadLetterQueuQueueArgs,
        name: dlQueuName,
        messageRetentionSeconds:
          args?.sqsDeadLetterQueuQueueArgs?.messageRetentionSeconds || 1209600, // 14 days
      },
      { parent: this }
    );
    const queueName = `${name}-queue`;
    this.sqsQueue = new aws.sqs.Queue(
      queueName,
      {
        ...args?.sqsQueuArgs,
        name: queueName,
        redrivePolicy: this.deadLetterQueue.arn.apply((arn) =>
          JSON.stringify({
            deadLetterTargetArn: arn,
            maxReceiveCount:
              args?.sqsDeadLetterQueuQueueArgs?.maxReceiveCount || 2,
          })
        ),
        visibilityTimeoutSeconds:
          args?.sqsDeadLetterQueuQueueArgs?.visibilityTimeoutSeconds || 1800, // 30 minutes
      },
      { parent: this }
    );
    new aws.sqs.QueuePolicy(
      `${name}-dl-policy`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: 'sqs:SendMessage',
              Resource: pulumi.interpolate`${this.deadLetterQueue.arn}`,
              Condition: {
                ArnEquals: {
                  'aws:SourceArn': pulumi.interpolate`${this.sqsQueue.arn}`,
                },
              },
            },
          ],
        }),
        queueUrl: this.deadLetterQueue.url,
      },
      { parent: this }
    );
    new aws.lambda.Permission(
      `${name}-lambda-sqs-permission`,
      {
        action: 'lambda:InvokeFunction',
        principal: 'sqs.amazonaws.com',
        sourceArn: this.sqsQueue.arn,
        function: this.lambda.function.name,
      },
      {
        parent: this.lambda,
      }
    );
    new aws.lambda.EventSourceMapping(
      `${name}-lambda-event-mapping`,
      {
        batchSize: 10,
        eventSourceArn: this.sqsQueue.arn,
        functionName: this.lambda.function.name,
      },
      {
        parent: this.lambda,
      }
    );
    this.snsSubscription = new aws.sns.TopicSubscription(
      `${name}-subs`,
      {
        ...snsSubscriptionArgs,
        protocol: 'sqs',
        endpoint: pulumi.interpolate`${this.sqsQueue.arn}`,
      },
      { parent: this }
    );
    this.output = {};
  }

  // private buildSNSTopicFromARN(
  //   name: string,
  //   snsArgs: SnsSubscriptionSqsLambdaArgs['snsSubscriptionArgs']
  // ) {
  //   const { topic } = snsArgs;
  //   if (topic instanceof aws.sns.Topic) {
  //     return topic;
  //   }

  //   return aws.sns.Topic.get(
  //     `${name}-topic`,
  //     pulumi.interpolate`${snsArgs.topic}`
  //   );
  // }
}
export default SnsSubscriptionSqsLambda;
