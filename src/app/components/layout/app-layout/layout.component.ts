import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router,  RouterModule, RouterOutlet } from '@angular/router';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { IEnum, IWorkshop } from 'app/app.model';
import { MenuItem, MessageService } from 'primeng/api';
import { catchError, concatMap, filter, lastValueFrom, of, switchMap, tap } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { PrimeNG } from 'primeng/config';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { ThemeService } from 'app/services/theme.service';
import { Menu } from 'primeng/menu';
@Component({
  selector: 'app-layout',
  standalone: true,
 imports: [
    ...SHARED_IMPORTS,
    RouterModule,
    RouterOutlet,
    Menu
  ],  
  templateUrl: './layout.component.html',
  providers: [MessageService]
})
export class LayoutComponent implements OnInit {
  items: MenuItem[] | undefined;
  workshop!:IWorkshop;
  selectedWorkshop!:IWorkshop;
  workshops:IWorkshop[] = [];
  selectedLang:string = '';
  version = '';
  selectedTheme = '';  
palettes = [
  { label: 'Professional Blue', value: 'blue', color: '#3b82f6' },     // Default
  { label: 'Modern Indigo',     value: 'indigo', color: '#4f46e5' },
  { label: 'Industrial Teal',   value: 'teal', color: '#0d9488' },
  { label: 'Minimal Slate',     value: 'slate', color: '#64748b' },
  { label: 'Fresh Emerald',     value: 'emerald', color: '#10b981' },
  { label: 'Deep Red',          value: 'red', color: '#b91c1c' }       // Muted red (not alert red)
];
   isDark = false;
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
    .pipe(filter(e => e instanceof NavigationEnd))
    .subscribe((e: any) => {
      this.selectedRoute = e.urlAfterRedirects;
      this.buildMenu();
      this.currentMenuLabel = this.getSelectedMenuLabel();
    });
  }
       
  ngOnInit(): void {
    this.workshopService
    .getWorkshop()
    .pipe(
      catchError((err) => {
        console.log(err);
        throw err;
      })
    )
    .subscribe((response: any) => {
      if(response){
        this.workshop = response; 
        this.workshops.push(this.workshop);
        this.selectedWorkshop = this.workshops[0];
        this.theme.setPrimaryPalette(this.selectedWorkshop.defaultTheme);
        this.selectedTheme = this.selectedWorkshop.defaultTheme;
        
        this.selectedLang = sessionStorage.getItem('lang') || this.selectedWorkshop.defaultLang;

        // this.logger.info('Selected Language from workshop::', this.selectedLang ,this.selectedWorkshop.defaultLang);
        // if(this.selectedLang === '' || this.selectedLang === null){
        //   this.selectedLang = this.selectedWorkshop.defaultLang;
        // }
        this.currentUser = sessionStorage.getItem('userName');
        this.logger.info(this.workshop);
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
                    // {
                    //     label: this.sharedService.T('vehicles'),
                    //     materialIcon: 'directions_car',
                    //     routerLink: '/sv/vehicle',
                    //     styleClass: this.selectedRoute.startsWith('/sv/vehicle') ? 'active-menu-item' : ''
                    // },

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
                       label: this.sharedService.T('reports'),
                        materialIcon: 'exit_to_app',
                        routerLink: '/sv/reports',
                        styleClass: this.selectedRoute.startsWith('/sv/reports') ? 'active-menu-item' : ''
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
  onDarkChange(checked: boolean) {
    this.theme.setDarkMode(checked);
  }
  onLogout() {
    this.sharedService
        .logout()
        .pipe(
          catchError((error) => {
            return of(null);
          }))
        .subscribe((res) => {
              // Clear all sessionStorage
              sessionStorage.clear();
              this.logger.info('User logged out successfully');
              // Redirect to home page
              this.router.navigate(['/']);
            });
  }

  getSelectedMenuLabel(): string {
    // if (!this.items || this.items.length === 0) {
    //   return 'Dashboard';
    // }
    
    // const menuItems = this.items[0]?.items || [];
    // const selected = menuItems.find(item => 
    //   item.routerLink && this.selectedRoute.startsWith(item.routerLink as string)
    // );
    // return selected?.label || this.sharedService.T('welcome');
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
  } else if (this.selectedRoute.startsWith('/sv/reports')) {
    return this.sharedService.T('reports');
  } else if (this.selectedRoute.startsWith('/sv/setting')) {
    return this.sharedService.T('settings');
  } else if (this.selectedRoute.startsWith('/sv/vehicle')) {
    return this.sharedService.T('searchVehicle');
  } else {
    return '';
  }

  }
}
