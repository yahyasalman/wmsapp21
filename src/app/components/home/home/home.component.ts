import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';
import { WmsUser } from 'app/app.model';
import { MessageService } from 'primeng/api';
import { environment } from 'environments/environment';
import { catchError, map, of, tap, finalize } from "rxjs";
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';

interface Feature {
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [MessageService]
})


export class HomeComponent {
  private baseUrl: string = environment.BASE_URL;
  loginForm!: FormGroup;
  invalidMessage: string = '';
  isDialogVisible: boolean = false;
  isLoading: boolean = false; // Loader control variable
  mobileMenuOpen = false;

  features: Feature[] = [
    {
      title: 'Kundregister',
      description: 'Samla all kundinformation på ett ställe.'
    },
    {
      title: 'Skapa Offerter',
      description: 'Skapa och skicka offerter på minuter.'
    },
    {
      title: 'Arbetsorder',
      description: 'Hantera jobb och resurser effektivt.'
    },
    {
      title: 'Fakturering',
      description: 'Skapa professionella fakturor direkt.'
    },
    {
      title: 'Schemaläggning',
      description: 'Planera arbetsdagen utan stress.'
    },
    {
      title: 'Digital Servicebok',
      description: 'Full servicehistorik för varje fordon.'
    }
  ];

  constructor(
    private logger: LogService,
    private http: HttpClient,
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef,
    private router: Router,
    private messageService: MessageService,
    private sharedService: SharedService,
    
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      "email": ['', [Validators.required, Validators.email]],
      "password": ['', Validators.required]
    });
    
  }
  show() {
    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Message Content', life: 3000 });
  }

  test(event: any) {
    this.logger.info(event.value);
  }

  onLoginFormSubmitted() {
    // Mark form as touched to show validation errors
    this.loginForm.markAllAsTouched();
    
    // Check if form is valid
    if (this.loginForm.invalid) {
      this.invalidMessage = 'Vänligen fyll alla obligatoriska fält.';
      return;
    }

    // Show loader
    this.isLoading = true;
    this.invalidMessage = ''; // Clear previous error messages

    this.sharedService
      .login(this.loginForm.value as WmsUser)
      .pipe(
        catchError((error) => {
          if (error.status === 400) {
            this.invalidMessage = 'Ogiltigt användarnamn eller lösenord';  
          } else {
            this.invalidMessage = 'Ett oväntat fel uppstod.';
          }
          return of(null);
        }),
        finalize(() => {
          // Hide loader whether request succeeds or fails
          this.isLoading = false;
        })
      )
      .subscribe((res) => {
        this.logger.info(res);
        if (!res) return;

        // Store user data in session storage
        sessionStorage.setItem('userName', res.Email); 
        sessionStorage.setItem('accessToken', res.token);
        sessionStorage.setItem('wmsId', res.wmsId);
        sessionStorage.setItem('workshopName', res.displayName);
        sessionStorage.setItem('country', res.country);
        // setting user preferred language
        sessionStorage.setItem('lang', 'sv');
        // Navigate to dashboard
        this.sharedService.loadResources();
        this.router.navigate(['/sv/dashboard']); 
        
      });
  }

  navigateToForgotPassword(event: Event) {
    event.preventDefault(); // Prevent the default anchor behavior
    this.router.navigate(['/webview/forgetpassword']); // Navigate to the route
  }

  openDialog() {
    this.isDialogVisible = true;
  }

  onCancel() {
    this.isDialogVisible = false;
  }


  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  openLogin(): void {
    console.log('Open login modal');
  }

  openDemo(): void {
    console.log('Open demo modal');
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight - 100) {
        el.classList.add('visible');
      }
    });
  }


}
