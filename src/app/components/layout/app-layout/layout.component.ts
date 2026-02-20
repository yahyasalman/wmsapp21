import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router,  RouterModule, RouterOutlet } from '@angular/router';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { IEnum, IWorkshop } from 'app/app.model';
import { MenuItem, MessageService } from 'primeng/api';
import { catchError, concatMap, lastValueFrom, of, switchMap, tap } from 'rxjs';
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
  }
              
  ngOnInit(): void {
    this.theme.setPrimaryPalette(this.selected);
    this.selectedLang = sessionStorage.getItem('lang') || 'sv';
    this.items = [
            {
                label: 'Menu',
                items: [
                    {
                        label: this.sharedService.T('dashboard'),
                        icon: 'pi pi-palette',
                        routerLink: '/sv/dashboard'
                    },
                    {
                        label: this.sharedService.T('customers'),
                        icon: 'pi pi-link',
                        routerLink:'/sv/customer'
                    },
                    {
                        label: this.sharedService.T('bookings'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/booking'
                    },
                                        {
                        label: this.sharedService.T('offers'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/offer'
                    },
                    {
                        label: this.sharedService.T('workorders'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/workorder'
                    },
                    {
                        label: this.sharedService.T('invoices'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/invoice'
                    },
                                        {
                        label: this.sharedService.T('digitalServiceBook'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/digitalservice'
                    },
                    {
                        label: this.sharedService.T('products'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/product'
                    },
                    {
                        label: this.sharedService.T('suppliers'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/supplier'
                    },

                   {
                        label: this.sharedService.T('employees'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/employee'
                    },
                    {
                       label: this.sharedService.T('attendanceRegister'),
                        icon: 'pi pi-home',
                        routerLink: '/sv/employment'
                    }





                ]
            }
        ];




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
