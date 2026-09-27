import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const UNIVERSITY_DOMAIN = '@paruluniversity.ac.in';

export function IsUniversityEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUniversityEmail',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          return value.toLowerCase().endsWith(UNIVERSITY_DOMAIN);
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must use a Parul University email address`;
        },
      },
    });
  };
}
