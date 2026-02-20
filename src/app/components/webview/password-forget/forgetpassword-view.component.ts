import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { catchError, of} from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';


@Component({
  selector: 'forgetpassword-view',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS
    // All modules are already in SHARED_IMPORTS
  ],  providers: [],
    templateUrl: './forgetpassword-view.component.html',

})
export class ForgetPasswordViewComponent  {
 
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

  onForgotPasswordSubmitted() {
    if (this.forgotPasswordForm.valid) {
      const email = this.forgotPasswordForm.get('email')?.value;

      // Simulate sending a reset link
      console.log('Sending reset link to:', email);

      this.sharedService
      .forgotPassword(this.forgotPasswordForm.value)
      .pipe(
        catchError((error) => {
          console.error('Error forgot password:', error);
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.successMessage = 'En återställningslänk har skickats till din e-postadress.';
        }
      });


      // Display success message
      
    }
  }

  navigateToLogin() {
    // Navigate to the login page
    console.log('Navigating to login page');
  }
}