import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from "@angular/forms";
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';
import { WmsUser } from 'app/app.model';
import { MessageService } from 'primeng/api';
import { environment } from 'environments/environment';
import { finalize, takeUntil, Subject } from "rxjs";
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
  expanded: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    MessageModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [MessageService]
})


export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private baseUrl: string = environment.BASE_URL;
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  demoForm!: FormGroup;
  invalidMessage: string = '';
  isDialogVisible: boolean = false;
  isLoading: boolean = false; // Loader control variable
  imagesUrl = environment.production ? `${environment.CDN_URL}/images/` : 'assets/images/';
  
  
  mobileMenuOpen = false;
  isSigningUp: boolean = false;
  signupSuccess: boolean = false;
  isDemoModalVisible: boolean = false;
  isDemoSubmitting: boolean = false;
  demoSuccess: boolean = false;

  features: Feature[] = [
    {
      icon: 'group',
      title: 'Kundregister',
      description: 'Samla all kundinformation på ett ställe med kundspecifika inställningar. Tagga dina kunder, skapa smart segmentering och få full kontroll över din kundöversikt.'
    },
    {
      icon: 'assignment_turned_in',
      title: 'Skapa Offerter',
      description: 'Skapa en offert på några minuter och skicka den smidigt via e-post eller WhatsApp med ett klick! När kunden godkänner kan du enkelt konvertera offerten till en arbetsorder eller faktura.'
    },
    {
      icon: 'engineering',
      title: 'Arbetsorder',
      description: 'Skapa och följ upp arbetsorder på sekunder – smidigt, snabbt och anpassat för din verkstad! Effektivisera din arbetsdag med smarta funktioner som gör det enkelt att hantera jobb, resurser och uppföljning i realtid.'
    },
    {
      icon: 'request_quote',
      title: 'Fakturering',
      description: 'Skapa professionella fakturor direkt från arbetsorder eller offerter. Integrering med ekonomisystem gör fakturering enkel och effektiv. Automatiska påminnelser hjälper dig att få betalt i tid.'
    },
    {
      icon: 'calendar_today',
      title: 'Schemaläggning',
      description: 'Hantera bokningar och resurser smidigt i kalendern. Se direkt när bilar, verktyg och personal är tillgängliga och planera arbetsdagen utan stress.'
    },
    {
      icon: 'book',
      title: 'Digital Servicebok',
      description: 'Ge dina kunder full transparens med en digital servicebok för varje fordon. All servicehistorik, utförda arbeten och bilder samlas på ett ställe och är lättåtkomlig för både dig och kunden.'
    }
  ];

  faqItems: FaqItem[] = [
    {
      question: 'Vad ingår i priset på 499 kr/månad?',
      answer: 'För 499 kr per användare och månad får du tillgång till alla funktioner i Digital Workshop - kundregister, offerthantering, arbetsorder, digital servicebok, schemaläggning, rapporter, statistik och vår AI Assistant.',
      expanded: false
    },
    {
      question: 'Hur fungerar AI Assistant för vår verkstad?',
      answer: 'Vår AI Assistant hjälper med diagnostikstöd, prisberäkning, dokumentationshjälp och kundkommunikation.',
      expanded: false
    },
    {
      question: 'Vad är Digital Servicebok?',
      answer: 'Digital Servicebok sparar hela servicehistoriken för varje fordon i kundregistret.',
      expanded: false
    },
    {
      question: 'Hur fungerar kundkommunikationen i systemet?',
      answer: 'Systemet erbjuder offerter via e-post, WhatsApp och automatiska påminnelser.',
      expanded: false
    },
    {
      question: 'Kan systemet integreras med mitt bokföringsprogram?',
      answer: 'Ja, vi har färdiga integrationer mot Fortnox, Visma m.fl.',
      expanded: false
    }
  ];

  constructor(
    private logger: LogService,
    private http: HttpClient,
    private readonly formBuilder: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      "email": ['', [Validators.required, Validators.email]],
      "password": ['', Validators.required]
    });

    this.signupForm = this.formBuilder.group({
      "companyName": ['', Validators.required],
      "organizationNumber": ['', Validators.required],
      "phoneNumber": ['', Validators.required],
      "email": ['', [Validators.required, Validators.email]],
      "password": ['', [Validators.required, Validators.minLength(6)]]
    });

    this.demoForm = this.formBuilder.group({
      "name": ['', Validators.required],
      "companyName": ['', Validators.required],
      "email": ['', [Validators.required, Validators.email]],
      "phoneNumber": ['', Validators.required]
    });
    
  }

  toggleFaq(index: number): void {
    // Close all other FAQs
    this.faqItems.forEach((item, i) => {
      if (i !== index) {
        item.expanded = false;
      }
    });

    // Toggle current FAQ
    this.faqItems[index].expanded = !this.faqItems[index].expanded;
  }
  show() {
    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Message Content', life: 3000 });
  }

  test(event: any) {
    this.logger.info(event.value);
  }

  onLoginFormSubmitted() {
    this.loginForm.markAllAsTouched();
    
    if (this.loginForm.invalid) {
      this.invalidMessage = 'Vänligen fyll alla obligatoriska fält.';
      return;
    }

    this.isLoading = true;
    this.invalidMessage = '';

    this.sharedService
      .login(this.loginForm.value as WmsUser)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.logger.info(res);
          if (!res) return;

          sessionStorage.setItem('userName', res.userName);
          sessionStorage.setItem('accessToken', res.token);
          sessionStorage.setItem('wmsId', res.wmsId);
          sessionStorage.setItem('workshopName', res.displayName);
          sessionStorage.setItem('country', res.country);
          sessionStorage.setItem('lang', 'sv');
          // ResourcesLoadedGuard will handle loading resources on /sv route
          this.router.navigate(['/sv/dashboard']);
        },
        error: (error) => {
          if (error.status === 400) {
            this.invalidMessage = 'Ogiltigt användarnamn eller lösenord';
          } else {
            this.invalidMessage = 'Ett oväntat fel uppstod.';
          }
          this.logger.error('Login error:', error);
        }
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

  onSignupSubmit(): void {
    this.signupForm.markAllAsTouched();

    if (this.signupForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Fel', detail: 'Vänligen fyll alla obligatoriska fält korrekt.' });
      return;
    }

    this.isSigningUp = true;

    this.sharedService
      .signup(this.signupForm.value)
      .pipe(
        finalize(() => { this.isSigningUp = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.logger.info('Signup successful:', response);
            this.signupSuccess = true;
            this.messageService.add({ severity: 'success', summary: 'Framgång', detail: 'Din registrering är genomförd. Ditt konto aktiveras snart.' });
            
            setTimeout(() => {
              this.signupSuccess = false;
              this.signupForm.reset();
            }, 5000);
          }
        },
        error: (error) => {
          this.logger.error('Signup error:', error);
          const errorMessage = error?.error?.message || 'Ett oväntat fel uppstod under registreringen.';
          this.messageService.add({ severity: 'error', summary: 'Registreringsfel', detail: errorMessage });
        }
      });
  }

  openLogin(): void {
    console.log('Open login modal');
  }

  openDemo(): void {
    this.isDemoModalVisible = true;
  }

  closeDemo(): void {
    this.isDemoModalVisible = false;
    // Reset demo form when closing modal
    this.demoForm.reset();
    this.demoSuccess = false;
  }

  onDemoSubmit(): void {
    this.demoForm.markAllAsTouched();

    if (this.demoForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Fel', detail: 'Vänligen fyll alla obligatoriska fält korrekt.' });
      return;
    }

    this.isDemoSubmitting = true;

    this.sharedService
      .bookDemo(this.demoForm.value)
      .pipe(
        finalize(() => { this.isDemoSubmitting = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.logger.info('Demo booking successful:', response);
            this.demoSuccess = true;
            this.messageService.add({ severity: 'success', summary: 'Framgång', detail: 'Vi kontaktar dig snart på e-postadressen du angav för att boka in tid för demo.' });
            
            setTimeout(() => {
              this.closeDemo();
            }, 5000);
          }
        },
        error: (error) => {
          this.logger.error('Demo booking error:', error);
          const errorMessage = error?.error?.message || 'Ett oväntat fel uppstod vid bokning av demo.';
          this.messageService.add({ severity: 'error', summary: 'Bokningsfel', detail: errorMessage });
        }
      });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
