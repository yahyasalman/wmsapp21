import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { finalize, takeUntil, Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';


@Component({
  selector: 'password-view',
  standalone: true,
 imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    MessageModule
  ],
  providers: [],
  templateUrl: './resetpassword-view.component.html',

})
export class ResetPasswordViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
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
        finalize(() => {}),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.successMessage = 'Lyckat! Ditt lösenord har återställts.';
          }
        },
        error: (error) => {
          this.logger.error('Error resetting password:', error);
        }
      });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
