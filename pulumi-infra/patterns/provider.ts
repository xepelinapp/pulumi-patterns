import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export type RepositoryUrl = `https://github.com/${string}`;
export type TagConfig = {
  team: string;
  owner: string;
  repo: RepositoryUrl;
};
export type ProviderArgs = Omit<aws.ProviderArgs, 'defaultTags'> & {
  tags: TagConfig;
};

class Provider extends aws.Provider {
  constructor(name: string, args: ProviderArgs, opts?: pulumi.ResourceOptions) {
    super(
      name,
      {
        ...args,
        defaultTags: {
          tags: {
            ...args.tags,
            provision: 'Pulumi',
            environment: Provider.getValidEnviroment(),
          },
        },
      },
      opts
    );
  }

  private static getValidEnviroment() {
    const environment = pulumi.getStack();
    if (!/\b(?:production|staging)\b|\btest(\b|-)/.test(environment)) {
      throw new Error(
        'Invalid stack name: valid names are production, staging, test, test-${string}'
      );
    }

    return environment;
  }
}
export default Provider;
