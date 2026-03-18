import { Component, OnInit, PLATFORM_ID, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Form, FormBuilder, FormGroup } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import {IInvoice, IMonthSummary, IOffer, IOutStandingBalance, IPager, ITopCustomer, ITopManufacturer, ITopSale, IUnpaidInvoice } from 'app/app.model';
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';
import { DashboardService } from 'app/services/dashboard.service';
import {TooltipItem } from 'chart.js';

// RxJS
import { catchError, concatMap, forkJoin, map, Observable, of, switchMap, tap, Subject } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { InvoiceService } from 'app/services/invoice.service';
import { SelectChangeEvent } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-dashboard-list',
  standalone: true,
 imports: [
    ...SHARED_IMPORTS,ProgressSpinnerModule,ProgressBarModule 
  ],
    templateUrl: './dashboard-list.component.html',
  styleUrl: './dashboard-list.component.css'
})
export class DashboardListComponent implements OnInit, OnDestroy {
  
  private readonly monthKeys = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december'
];
months: { key: string; value: string }[] = [];
progressPercentage:number = 0;

  
  unpaidInvoices: IUnpaidInvoice[] = [];
  waitingOffers:IOffer[] = [];
  pager:IPager = <IPager>{};
  
  topSales:ITopSale[] = [];
  topCustomers:ITopCustomer[] = [];
  topManufacturers:ITopManufacturer[] = [];
  outStandingInvoices:IOutStandingBalance = {priceIncVat:0.00,vat:0.00,orderCount:0};
  outStandingOffers:IOutStandingBalance = {priceIncVat:0.00,vat:0.00,orderCount:0};
  
  invoices: IInvoice[] = [];
  filters:FormGroup;
  currentMonthSale:number = 0;
  currentMonthSaleTarget:number = 0;
  currentMonthOrders = '';
  currentMonthWorkOrders = '';
  currentMonthCustomers = '';
  currentMonthOffers = '';
  currentMonthDigitalServices = '';
  selectedMonth:string = '';
  lineChartData: any;
  lineChartOptions: any;
  userPrompt: string = '';
  platformId = inject(PLATFORM_ID);
  isLoading:boolean = false;
percentage: number = 0;

  statMonths:any[] = [];
  selectedStatMonths = '3';
  private destroy$ = new Subject<void>();
  
  constructor(private cd: ChangeDetectorRef,
              private readonly router: Router,
              private readonly fb:FormBuilder, 
              private readonly logger: LogService,
              public readonly sharedService:SharedService,
              public readonly dashboardService:DashboardService,
              private readonly invoiceService: InvoiceService,
              ){
       
       this.filters = this.fb.group({
      currentPage:1,
      pageSize:5,
      sortBy:'priceIncVat',
      sortDir:'-1'
    });
  
  
   }

   ngOnInit() {
   this.statMonths = [
            { value:'3',text:this.sharedService.T('previous3Months')},
            { value:'6',text:this.sharedService.T('previous6Months')},
            { value:'12',text:this.sharedService.T('previousYear')},
        ];
          
  this.loadvehicle();
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  let cyear: number;
  let cmonth: number;
  if (currentDay < 10) {
    cmonth = currentDate.getMonth(); 
    cyear = currentDate.getFullYear();
  if (cmonth === 0) {
      cmonth = 12;
      cyear -= 1;
    }
  } else {
          cmonth = currentDate.getMonth() + 1; // Current month (1-based index)
          cyear = currentDate.getFullYear();
  }
    const monthName = new Date(cyear, cmonth - 1).toLocaleString('default', { month: 'long' });
    this.selectedMonth = `${monthName} ${cyear}`;
    
    this.loadDashboardCards();
    
    
    this.loadCurrentMonthStats(cyear.toString(),cmonth.toString());
    this.loadLineChart("3");
    this.getUnpaidInvoices();
    this.getWaitingOffers();
    
    // Listen for theme/palette changes and refresh chart
    this.listenForThemeChanges();

    
  }

  /**
   * Listen for theme/palette changes using MutationObserver
   * When user changes theme in layout, CSS variables update, this triggers chart refresh
   */
  private listenForThemeChanges(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Find the dynamic style element that contains primary palette CSS
    const dynamicStyleEl = document.getElementById('dynamic-primary');
    
    if (dynamicStyleEl) {
      // Observe changes to the style element's content (childList includes text nodes)
      const observer = new MutationObserver(() => {
        // When theme palette changes, CSS variables update
        // Refresh the chart to pick up new colors
        if (this.topSales && this.topSales.length > 0) {
          // Add a small delay to ensure CSS variables have been updated
          setTimeout(() => {
            this.lineChart();
            this.cd.markForCheck();
          }, 50);
        }
      });

      // Observe text content changes in the style element
      observer.observe(dynamicStyleEl, {
        childList: true,    // Watch for child nodes being added/removed
        characterData: true, // Watch for text node changes
        subtree: true       // Watch subtree
      });
    }

    // Also observe document root for class changes (dark mode toggle)
    const rootObserver = new MutationObserver(() => {
      if (this.topSales && this.topSales.length > 0) {
        setTimeout(() => {
          this.lineChart();
          this.cd.markForCheck();
        }, 50);
      }
    });

    rootObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: false
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadvehicle()
  {
    this.sharedService
      .getVehicleInfo('AAM14L')
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.logger.info('Vehicle Info:');
          this.logger.info(response);
        }
      });
  }

loadMonths(): Observable<void> {
  const months = this.monthKeys.map((key) => ({
    key,
    value: this.sharedService.T(key) 
  }));

  // Assign the result to this.months and return an Observable<void>
  return new Observable<void>((observer) => {
    this.months = months; // Assign the result to this.months
    observer.next(); // Emit a completion signal
    observer.complete(); // Mark the observable as complete
  });
}

loadCurrentMonthStats(cyear: string, cmonth: string) {
  // Combine all API calls into a single observable using forkJoin
  forkJoin({
    currentMonthSaleTarget: this.dashboardService.getMonthSaleTarget(cyear, cmonth).pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    currentMonthSale: this.dashboardService.getMonthSale(cyear, cmonth).pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    currentMonthOrders: this.dashboardService.getMonthOrders(cyear, cmonth).pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    currentMonthOffers: this.dashboardService.getMonthOffers(cyear, cmonth).pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    currentMonthDigitalServices: this.dashboardService.getMonthDigitalServices(cyear, cmonth).pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    currentMonthWorkOrders: this.dashboardService.getMonthWorkOrders(cyear, cmonth).pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    currentMonthCustomers: this.dashboardService.getMonthCustomers(cyear, cmonth).pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    )
  }).subscribe({
    next: (results) => {
      // Assign the results to the respective properties
      this.currentMonthSaleTarget = Number(results.currentMonthSaleTarget);
      this.currentMonthSale = Number(results.currentMonthSale);
      this.progressPercentage = Math.round(
  (Number(results.currentMonthSale) / Number(results.currentMonthSaleTarget)) * 100
);

      this.currentMonthOrders = results.currentMonthOrders;
      this.currentMonthOffers = results.currentMonthOffers;
      this.currentMonthDigitalServices = results.currentMonthDigitalServices;
      this.currentMonthWorkOrders = results.currentMonthWorkOrders;
      this.currentMonthCustomers = results.currentMonthCustomers;

      // Log results for debugging
      this.logger.info('Current Month Sale Target:', this.currentMonthSaleTarget);
      this.logger.info('Current Month Sale:', this.currentMonthSale);
      this.logger.info('Current Month Orders:', this.currentMonthOrders);
      this.logger.info('Current Month Offers:', this.currentMonthOffers);
      this.logger.info('Current Month Digital Services:', this.currentMonthDigitalServices);
      this.logger.info('Current Month Work Orders:', this.currentMonthWorkOrders);
      this.logger.info('Current Month Customers:', this.currentMonthCustomers);

      // Call dependent methods here
       if (this.currentMonthSaleTarget > 0) {
      this.logger.info('Calculating percentage:', this.currentMonthSale, this.currentMonthSaleTarget);
      this.percentage = Math.min((this.currentMonthSale / this.currentMonthSaleTarget) * 100, 100);
    } else {
      // Handle division by zero
      this.percentage = 0;
    }
    },
    error: (err) => {
      this.logger.error('Error loading current month stats:', err);
    }
  });
}

  

  getAverageperOrder(): number {
  const sale = Number(this.currentMonthSale);
  const orders = Number(this.currentMonthOrders);
  return orders > 0 ? sale / orders : 0;
}

loadLineChart(noOfPreviousMonths:string){
  this.dashboardService
  .getTopSales(noOfPreviousMonths)
  .pipe(
    catchError((err) => {
      this.logger.error(err);
      throw err;
    }),
    switchMap((res) => {
      this.topSales = res;
      this.logger.info('Top Sales Data:', this.topSales);
      return this.loadMonths(); // Assuming loadMonths() returns an Observable
    })
  )
  .subscribe({
    next: () => {
      this.logger.info('MONTHS MONTHS', this.months);
      this.lineChart();
    },
    error: (err) => {
      this.logger.error('Error during execution', err);
    },
  });

}

onPeriodChange(event: any): void {
  if (!event.value)
      event.value = '';
  const selectedValue = event.value; // Get the selected value
  this.selectedStatMonths = selectedValue; // Update the selected value
  this.loadLineChart(selectedValue); // Update the chart based on the selected period
}

  getUnpaidInvoices() {
     this.isLoading = true;
    this.logger.info('getUnpaidInvoices',this.filters.value);
    this.dashboardService
      .getUnpaidInvoices(this.filters)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        this.unpaidInvoices = res;
        //this.pager = res.pager;
        this.logger.info('unpaidInvoices',this.unpaidInvoices);
      });

      setTimeout(() => {
  this.isLoading = false;
}, 500);
    }

  getWaitingOffers() {
     this.isLoading = true;
    this.logger.info('getWaitingOffers',this.filters.value);
    this.dashboardService
      .getWaitingOffers()
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        this.waitingOffers = res;
        //this.pager = res.pager;
        this.logger.info('waitingOffers',this.waitingOffers);
      });

      setTimeout(() => {
  this.isLoading = false;
}, 500);
    }

 async loadDashboardCards() {
  this.isLoading = true;

  // Combine all API calls into a single observable using forkJoin
  forkJoin({
    outStandingOffers: this.dashboardService.getOutStandingOffers().pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    outStandingInvoices: this.dashboardService.getOutStandingInvoices().pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    topManufacturers: this.dashboardService.getTopManufacturers().pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    ),
    topCustomers: this.dashboardService.getTopCustomers().pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err; // Propagate the error
      })
    )
  }).subscribe({
    next: (results) => {
      // Assign the results to the respective properties
      this.outStandingOffers = results.outStandingOffers;
      this.outStandingInvoices = results.outStandingInvoices;
      this.topManufacturers = results.topManufacturers;
      this.topCustomers = results.topCustomers;

      // Log results for debugging
      this.logger.info('Outstanding Offers:', this.outStandingOffers);
      this.logger.info('Outstanding Invoices:', this.outStandingInvoices);
      this.logger.info('Top Manufacturers:', this.topManufacturers);
      this.logger.info('Top Customers:', this.topCustomers);

      // Call dependent methods here
     

    },
    error: (err) => {
      this.logger.error('Error loading dashboard cards:', err);
    },
    complete: () => {
      this.isLoading = false; // Ensure loading state is updated
    }
  });
}

  /**
   * Convert hex color to rgba format
   */
  

  lineChart() {
    this.logger.info('Initializing chart with top sales data:');
    this.logger.info('Initializing chart with top sales data:', this.topSales);

    if (isPlatformBrowser(this.platformId)) {
      // Get PrimeNG Design Tokens from CSS Variables (v21 Styled Mode)
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color').trim();
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color').trim();
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color').trim();

      
      // Primary Color Tokens (Automatically adapts to selected theme: Rose, Indigo, Emerald, Violet)
      const primaryColor = documentStyle.getPropertyValue('--p-primary-500').trim();
      const primaryLight = documentStyle.getPropertyValue('--p-primary-200').trim();
      
      const emerald = documentStyle.getPropertyValue('--p-emerald-500').trim();
      const emeraldLight = documentStyle.getPropertyValue('--p-emerald-200').trim();
      
      const amber = documentStyle.getPropertyValue('--p-amber-500').trim();
      const amberLight = documentStyle.getPropertyValue('--p-amber-200').trim();

      
      
      
      this.lineChartData = {
        labels: Array.from({ length: this.topSales.map((m: any) => m.monthYear).length }, (_, i) => (this.months.find(m => m.key === this.topSales[i].monthYear.split('-')[0])?.value ?? '') + ' ' + this.topSales[i].monthYear.split('-')[1]), 
        datasets: [
          {
            label: 'Arbetskostnad',
            data: this.topSales.map((m: any) => Number(m.workSale)),
            fill: true,
            tension: 0.4,
            borderColor: primaryColor,
            backgroundColor: primaryLight,
            pointBackgroundColor: primaryColor,
            pointBorderColor: primaryColor,
            pointRadius: 0,
            pointHoverRadius: 8,
            borderWidth: 3,
            pointBorderWidth: 2,
          },
          {
            label: 'Reservdelar',
            data: this.topSales.map((m: any) => Number(m.partsSale)),
            fill: true,
            tension: 0.4,
            borderColor: emerald,
            backgroundColor: emeraldLight, // Tailwind's emerald-200 for a fresh contrast
            pointBackgroundColor: emerald,
            pointBorderColor: emerald,
            pointRadius: 0,
            pointHoverRadius: 8,
            borderWidth: 3,
            pointBorderWidth: 2,
          },
          {
            label: 'Others',
            data: this.topSales.map((m: any) => Number(m.otherSale)),
            fill: true,
            tension: 0.4,
            borderColor: amber,
            backgroundColor: amberLight,
            pointBackgroundColor: amber,
            pointBorderColor: amber,
            pointRadius: 0,
            pointHoverRadius: 8,
            borderWidth: 3,
            pointBorderWidth: 2,
          }

        ]
      };

      this.lineChartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: textColor,
              font: {
                size: 13,
                weight: 600 as any,
                family: '"Inter", sans-serif'
              },
              usePointStyle: true,
              padding: 20,
              boxWidth: 8,
              boxHeight: 8
            },
            position: 'top' as const
          },
          tooltip: {
            backgroundColor: textColor,
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: primaryColor,
            borderWidth: 1,
            titleFont: {
              size: 14,
              weight: 600 as any
            },
            bodyFont: {
              size: 13
            },
            displayColors: true,
            callbacks: {
              title: (tooltipItems: TooltipItem<'line'>[]) => {
                return tooltipItems[0]?.label ?? '';
              },
              label: (tooltipItem: TooltipItem<'line'>) => {
                return `${tooltipItem.dataset.label}: ${Number(tooltipItem.raw).toLocaleString('sv-SE', { maximumFractionDigits: 0 })} SEK`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary,
              font: {
                size: 12
              }
            },
            grid: {
              display: true,
              color: surfaceBorder,
              drawBorder: false,
              lineWidth: 0.5
            }
          },
          y: {
            ticks: {
              display: true,
              color: textColorSecondary,
              font: {
                size: 12
              },
              callback: (value: any) => {
                return Number(value).toLocaleString('sv-SE', { maximumFractionDigits: 0 });
              }
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false,
              lineWidth: 0.5
            }
          }
        },
        elements: {
          point: {
            radius: (context: any) => {
              return context.active ? 8 : 0;
            },
            hoverRadius: 8,
            hoverBackgroundColor: 'white',
            hoverBorderWidth: 2,
            hoverBorderColor: primaryColor
          },
          line: {
            borderCapStyle: 'round' as const,
            borderJoinStyle: 'round' as const
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      };
  
      this.cd.markForCheck();
    }
  }

  redirectToOrderCrudComponent() {
    this.router.navigate(['sv/workorder/crud']);
  }
  
  redirectToOfferCrudComponent() {
    this.router.navigate(['sv/offer/crud', {}]);
  }
    redirectToInvoiceCrudComponent() {
    this.router.navigate(['sv/invoice/crud', {}]);
  }
    redirectToCustomerCrudComponent() {
    this.router.navigate(['sv/customer/crud', {}]);
  }
  redirectToVehicleComponent() {
    this.router.navigate(['sv/vehicle', {}]);
  }
    redirectToProductCrudComponent() {
    this.router.navigate(['sv/product', {}]);
  }


}