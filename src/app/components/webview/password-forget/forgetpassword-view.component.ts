import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { finalize, takeUntil, Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';


@Component({
  selector: 'forgetpassword-view',
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
  templateUrl: './forgetpassword-view.component.html',

})
export class ForgetPasswordViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  forgotPasswordForm: FormGroup;
  successMessage: string | null = null;

  constructor(    
      private readonly fb: FormBuilder,
      private router: Router,
      private readonly route: ActivatedRoute,
      private logger: LogService,
      private readonly sharedService: SharedService,
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }
  ngOnInit(): void {
 }

  onForgotPasswordSubmitted() {
    if (this.forgotPasswordForm.valid) {
      const email = this.forgotPasswordForm.get('email')?.value;
      console.log('Sending reset link to:', email);

      this.sharedService
        .forgotPassword(this.forgotPasswordForm.value)
        .pipe(
          finalize(() => {}),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (res) => {
            if (res) {
              this.successMessage = 'En återställningslänk har skickats till din e-postadress.';
            }
          },
          error: (error) => {
            this.logger.error('Error forgot password:', error);
          }
        });
    }
  }

  navigateToLogin() {
    console.log('Navigating to login page');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}