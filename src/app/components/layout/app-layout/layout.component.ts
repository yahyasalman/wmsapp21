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
  workshop:IWorkshop | undefined;
  selectedLang:string = '';
  version = '';
  
  palettes = [
    { label: 'Rose', value: 'rose' },
    { label: 'Indigo', value: 'indigo' },
    { label: 'Emerald', value: 'emerald' },
    { label: 'Violet', value: 'violet' }
  ];
  selected = 'rose';
   isDark = false;
   selectedRoute: string = '';
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
    });
  }
       
  ngOnInit(): void {
    this.theme.setPrimaryPalette(this.selected);
    this.selectedLang = sessionStorage.getItem('lang') || 'sv';



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
                    {
                        label: this.sharedService.T('customers'),
                        materialIcon: 'group',
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
                        materialIcon: 'engineering',
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
                        materialIcon: 'calendar_today',
                        routerLink: '/sv/employment',
                        styleClass: this.selectedRoute.startsWith('/sv/employment') ? 'active-menu-item' : ''
                    },
                  {
                       label: this.sharedService.T('settings'),
                        materialIcon: 'calendar_today',
                        routerLink: '/sv/setting',
                        styleClass: this.selectedRoute.startsWith('/sv/employment') ? 'active-menu-item' : ''
                    },
                    {
                       label: this.sharedService.T('logout'),
                        materialIcon: 'calendar_today',
                        routerLink: '/sv/setting',
                        styleClass: this.selectedRoute.startsWith('/sv/employment') ? 'active-menu-item' : ''
                    }




                ]
            }
        ];


  }
  ChangeLang(event:any){

  this.logger.info('language changed::' + event.value);
  sessionStorage.setItem('lang',event.value);
  window.location.reload();
}
Logout()
{
  this.sharedService
        .logout()
        .pipe(
          catchError((error) => {
            return of(null);
          }))
        .subscribe((res) => {
              if (!res) return;
               sessionStorage.removeItem('userName'); 
              sessionStorage.removeItem('accessToken');
              sessionStorage.removeItem('wmsId');
              sessionStorage.removeItem('country');
              sessionStorage.removeItem('lang');
              this.logger.info('start errot');
              this.router.navigate(['']);
            });
 }

 onPaletteChange(palette: any) {
   this.logger.info('change value to::',palette);
    this.theme.setPrimaryPalette(palette.value);
  }
  onDarkChange(checked: boolean) {
    this.theme.setDarkMode(checked);
  }
}
