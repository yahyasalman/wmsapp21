import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router,  RouterModule, RouterOutlet } from '@angular/router';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { IEnum, IWorkshop } from 'app/app.model';
import { MenuItem, MessageService } from 'primeng/api';
import { filter, finalize, takeUntil, Subject } from 'rxjs';
import { PrimeNG } from 'primeng/config';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { ThemeService } from 'app/services/theme.service';
import { Menu } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout',
  standalone: true,
 imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    Menu,
    MenubarModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule
  ],
  templateUrl: './layout.component.html',
  providers: [MessageService]
})
export class LayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  items: MenuItem[] | undefined;
  workshop!: IWorkshop;
  selectedWorkshop!: IWorkshop;
  workshops: IWorkshop[] = [];
  selectedLang:string = '';
  version = '';
  selectedTheme = '';  
  imagesUrl = environment.production ? `${environment.CDN_URL}/images/` : 'assets/images/';
palettes = [
  { label: 'Professional Blue', value: 'blue', color: '#3b82f6' },     
  { label: 'Modern Indigo',     value: 'indigo', color: '#4f46e5' },
  { label: 'Industrial Teal',   value: 'teal', color: '#0d9488' },
  { label: 'Minimal Slate',     value: 'slate', color: '#64748b' },
  { label: 'Deep Red',          value: 'red', color: '#b91c1c' },
  { label: 'Industrial Amber',  value: 'amber', color: '#f59e0b' }
];
  currentUser:string |null = '' ;
   selectedRoute: string = '';
   currentMenuLabel: string = '';
    constructor(
              public readonly sharedService:SharedService,
              private readonly router:Router,
              private changeDetectorRef: ChangeDetectorRef,
              private logger: LogService,
              private config: PrimeNG,
              private http: HttpClient,
              private workshopService:WorkshopService,
              private theme: ThemeService
  ) {
      this.version = environment.Version; 
        this.router.events
    .pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (e: any) => {
        this.selectedRoute = e.urlAfterRedirects;
        this.buildMenu();
        this.currentMenuLabel = this.getSelectedMenuLabel();
      },
      error: (err: any) => {
        this.logger.error('Router navigation error:', err);
      }
    });
  }
       
  ngOnInit(): void {
    this.workshopService
      .getWorkshop()
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.workshop = response;
            this.workshops.push(this.workshop);
            this.selectedWorkshop = this.workshops[0];
            this.theme.setPrimaryPalette(this.selectedWorkshop.defaultTheme);
            this.selectedTheme = this.selectedWorkshop.defaultTheme;
            this.selectedLang = sessionStorage.getItem('lang') || this.selectedWorkshop.defaultLang;
            this.currentUser = sessionStorage.getItem('userName');
            this.logger.info(this.workshop);
          }
        },
        error: (err) => {
          this.logger.error('Error loading workshop:', err);
        }
      });
  }

  buildMenu() {
        this.items = [
            {
                label: '',
                items: [
                    {
                        label: this.sharedService.T('dashboard'),
                        materialIcon: 'dashboard',
                        routerLink: '/sv/dashboard',
                        styleClass: this.selectedRoute.startsWith('/sv/dashboard') ? 'active-menu-item' : ''
                    },
                    {
                        label: this.sharedService.T('customers'),
                        materialIcon: 'person',
                        routerLink:'/sv/customer',
                        styleClass: this.selectedRoute.startsWith('/sv/customer') ? 'active-menu-item' : ''

                    },
                    {
                        label: this.sharedService.T('bookings'),
                        materialIcon: 'calendar_today',
                        routerLink: '/sv/booking',
                        styleClass: this.selectedRoute === '/sv/booking' ? 'active-menu-item' : ''

                    },
                                        {
                        label: this.sharedService.T('offers'),
                        materialIcon: 'assignment_turned_in',
                        routerLink: '/sv/offer',
                        styleClass: this.selectedRoute === '/sv/offer' ? 'active-menu-item' : ''
                    },
                    {
                        label: this.sharedService.T('workorders'),
                        materialIcon: 'handyman',
                        routerLink: '/sv/workorder',
                        styleClass: this.selectedRoute === '/sv/workorder' ? 'active-menu-item' : ''
                    },
                    {
                        label: this.sharedService.T('invoices'),
                        materialIcon: 'request_quote', 
                        routerLink: '/sv/invoice',
                        styleClass: this.selectedRoute === '/sv/invoice' ? 'active-menu-item' : ''
                    },
                                        {
                        label: this.sharedService.T('digitalServiceBook'),
                        materialIcon: 'book',
                        routerLink: '/sv/digitalservice',
                        styleClass: this.selectedRoute === '/sv/digitalservice' ? 'active-menu-item' : ''
                    },
                    {
                        label: this.sharedService.T('products'),
                        materialIcon: 'inventory_2',
                        routerLink: '/sv/product',
                        styleClass: this.selectedRoute === '/sv/product' ? 'active-menu-item' : ''
                    },
                    {
                        label: this.sharedService.T('suppliers'),
                        materialIcon: 'storefront',
                        routerLink: '/sv/supplier',
                        styleClass: this.selectedRoute.startsWith('/sv/supplier') ? 'active-menu-item' : ''
                    },

                   {
                        label: this.sharedService.T('employees'),
                        materialIcon: 'id_card',
                        routerLink: '/sv/employee',
                        styleClass: this.selectedRoute.startsWith('/sv/employee') ? 'active-menu-item' : ''
                    },
      {
                        label: this.sharedService.T('attendanceRegister'),
                        materialIcon: 'punch_clock',
                        routerLink: '/sv/employment',
                        styleClass: this.selectedRoute.startsWith('/sv/employment') ? 'active-menu-item' : ''
                    },
                    {
                       label: this.sharedService.T('settings'),
                        materialIcon: 'settings',
                        routerLink: '/sv/setting',
                        styleClass: this.selectedRoute.startsWith('/sv/settings') ? 'active-menu-item' : ''
                    }

                ]
            }
        ];


  }
  ChangeLang(event:any){
  this.logger.info('language changed::' + event.value);
  sessionStorage.setItem('lang',event.value);
  sessionStorage.setItem('lang', event.value);
  this.selectedLang = event.value;
  window.location.reload();
}

 onPaletteChange(palette: any) {
   this.logger.info('change value to::',palette);
    this.theme.setPrimaryPalette(palette);
  }

  onLogout() {
    this.sharedService
        .logout()
        .pipe(
          finalize(() => {}),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (res) => {
            sessionStorage.clear();
            this.logger.info('User logged out successfully');
            this.router.navigate(['/']);
          },
          error: (error) => {
            this.logger.error('Error logging out:', error);
          }
        });
  }

  getSelectedMenuLabel(): string {
    if (this.selectedRoute.startsWith('/sv/dashboard')) {
      return this.sharedService.T('welcome');
    } else if (this.selectedRoute.startsWith('/sv/customer')) {
      return this.sharedService.T('customers');
    } else if (this.selectedRoute.startsWith('/sv/booking')) {
      return this.sharedService.T('bookings');
    } else if (this.selectedRoute.startsWith('/sv/offer')) {
      return this.sharedService.T('offers');
    } else if (this.selectedRoute.startsWith('/sv/workorder')) {
      return this.sharedService.T('workorders');
    } else if (this.selectedRoute.startsWith('/sv/invoice')) {
      return this.sharedService.T('invoices');
    } else if (this.selectedRoute.startsWith('/sv/digitalservice')) {
      return this.sharedService.T('digitalServiceBook');
    } else if (this.selectedRoute.startsWith('/sv/product')) {
      return this.sharedService.T('products');
    } else if (this.selectedRoute.startsWith('/sv/supplier')) {
      return this.sharedService.T('suppliers');
    } else if (this.selectedRoute.startsWith('/sv/employee')) {
      return this.sharedService.T('employees');
    } else if (this.selectedRoute.startsWith('/sv/employment')) {
      return this.sharedService.T('attendanceRegister');
    } else if (this.selectedRoute.startsWith('/sv/setting')) {
      return this.sharedService.T('settings');
    } else if (this.selectedRoute.startsWith('/sv/vehicle')) {
      return this.sharedService.T('searchVehicle');
    } else {
      return '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
