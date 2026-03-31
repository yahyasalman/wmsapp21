import { AbstractControl, ValidationErrors } from '@angular/forms';

export function emailOrTelephoneRequiredValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.get('email')?.value?.trim();
  const tel = control.get('telephone')?.value?.trim();

   if (!email && !tel) {
    // Form-level error
    return { contactRequired: true };
  }
  console.log('emailOrTelephoneRequiredValidator: email=', email, 'tel=', tel);
  return null;
}