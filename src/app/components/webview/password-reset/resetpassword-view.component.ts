import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import {catchError, of} from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';


@Component({
  selector: 'password-view',
  standalone: true,
 imports: [
    ...SHARED_IMPORTS
  ],  providers: [],
    templateUrl: './resetpassword-view.component.html',

})
export class ResetPasswordViewComponent implements OnInit {
  passwordResetForm!: FormGroup;
  successMessage: string | null = null;

  constructor(
    private logger: LogService,
    private readonly sharedService: SharedService,
    private readonly formBuilder: FormBuilder,
    private router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');
    const decodedToken = decodeURIComponent(token ? token : '');
    
    this.logger.info('Decoded Token:', decodedToken);

    this.passwordResetForm = this.formBuilder.group(
      {
        email: [email, Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        token: [decodedToken, Validators.required],
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  // Custom Validator to check if passwords match
  passwordsMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onResetFormSubmitted(): void {
    if (this.passwordResetForm.invalid) {
      return;
    }

    this.sharedService
      .resetPassword(this.passwordResetForm.value)
      .pipe(
        catchError((error) => {
          console.error('Error resetting password:', error);
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.successMessage = 'Lyckat! Ditt lösenord har återställts.';
        }
      });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
