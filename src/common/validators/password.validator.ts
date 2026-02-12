import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais',
        ...validationOptions,
      },
      validator: {
        validate(value: string) {
          if (!value || typeof value !== 'string') return false;

          const hasMinLength = value.length >= 8;
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

          return (
            hasMinLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialChar
          );
        },
        defaultMessage(args: ValidationArguments) {
          const failures: string[] = [];
          const value = args.value as string;

          if (!value || value.length < 8) failures.push('mínimo 8 caracteres');
          if (value && !/[A-Z]/.test(value)) failures.push('letra maiúscula');
          if (value && !/[a-z]/.test(value)) failures.push('letra minúscula');
          if (value && !/\d/.test(value)) failures.push('número');
          if (value && !/[!@#$%^&*(),.?":{}|<>]/.test(value))
            failures.push('caractere especial');

          return `Senha precisa de: ${failures.join(', ')}`;
        },
      },
    });
  };
}
