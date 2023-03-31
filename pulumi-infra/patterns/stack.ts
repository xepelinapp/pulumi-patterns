import * as pulumi from '@pulumi/pulumi';

import Provider, { ProviderArgs } from './provider';

export type StackArgs = {
  providerArgs: ProviderArgs;
};

class Stack extends pulumi.ComponentResource {
  public output: Record<string, unknown>;

  constructor(
    name: string,
    args: StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const { providerArgs } = args;
    super(
      'pkg:index:Stack',
      `${name}-stack`,
      {},
      {
        ...opts,
        providers: {
          aws: new Provider(`${name}-provider`, providerArgs),
        },
      }
    );
  }
}
export default Stack;
