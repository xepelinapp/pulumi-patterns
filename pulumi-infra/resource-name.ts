import * as pulumi from '@pulumi/pulumi';

export const getResourceName = (resourceName: string) => {
  const stack = pulumi.getStack();
  const project = pulumi.getProject();
  const name = `${project}-${stack}-${resourceName}`;
  if (name.length > 64) {
    throw new Error(
      `The name ${name} is too long. The maximum length is 64 characters.`
    );
  }

  return name;
};
