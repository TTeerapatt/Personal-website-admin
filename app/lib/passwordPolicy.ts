export type PasswordPolicyResult = {
    minLength: boolean;
    hasNumber: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasSpecial: boolean;
    requiredPassed: boolean;
  };
  
  const NUMBER_REGEX = /\d/;
  const UPPERCASE_REGEX = /[A-Z]/;
  const LOWERCASE_REGEX = /[a-z]/;
  const SPECIAL_REGEX = /[^A-Za-z0-9]/;
  
  export function evaluatePasswordPolicy(password: string): PasswordPolicyResult {
    const value = String(password ?? "");
    const minLength = value.length >= 12;
    const hasNumber = NUMBER_REGEX.test(value);
    const hasUppercase = UPPERCASE_REGEX.test(value);
    const hasLowercase = LOWERCASE_REGEX.test(value);
    const hasSpecial = SPECIAL_REGEX.test(value);
  
    return {
      minLength,
      hasNumber,
      hasUppercase,
      hasLowercase,
      hasSpecial,
      requiredPassed: minLength && hasNumber && hasUppercase,
    };
  }
  