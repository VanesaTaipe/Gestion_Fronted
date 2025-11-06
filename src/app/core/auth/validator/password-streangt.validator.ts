import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordStrength {
  hasExactLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  strength: number; 
}

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasExactLength = value.length >= 6; 
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid = hasExactLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    if (!passwordValid) {
      return {
        passwordStrength: {
          hasExactLength,
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSpecialChar
        }
      };
    }

    return null;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      hasExactLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false,
      strength: 0
    };
  }

  const hasExactLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let strength = 0;
  if (hasExactLength) strength += 20;
  if (hasUpperCase) strength += 20;
  if (hasLowerCase) strength += 20;
  if (hasNumber) strength += 20;
  if (hasSpecialChar) strength += 20;

  return {
    hasExactLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    strength
  };
}