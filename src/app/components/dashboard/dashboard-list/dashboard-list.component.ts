import { Component, OnInit, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Form, FormBuilder, FormGroup } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import {IInvoice, IMonthSummary, IOutStandingBalance, IPager, ITopCustomer, ITopManufacturer, ITopSale, IUnpaidInvoice } from 'app/app.model';
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';
import { DashboardService } from 'app/services/dashboard.service';
import {TooltipItem } from 'chart.js';

// RxJS
import { catchError, concatMap, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { InvoiceService } from 'app/services/invoice.service';
import { SelectChangeEvent } from 'primeng/select';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';


@Component({
  selector: 'app-dashboard-list',
  standalone: true,
 imports: [
    ...SHARED_IMPORTS,GenericLoaderComponent
  ],
    templateUrl: './dashboard-list.component.html',
  styleUrl: './dashboard-list.component.css'
})
export class DashboardListComponent implements OnInit {
  
  private readonly monthKeys = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december'
];
months: { key: string; value: string }[] = [];

  
  unpaidInvoices: IUnpaidInvoice[] = [];
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
  // const currentDate = new Date();
  // const monthName = currentDate.toLocaleString('default', { month: 'long' }); // Get full month name
  // const year = currentDate.getFullYear();
  // this.selectedMonth = `${monthName} ${year}`;
  
   }

   ngOnInit() {
    
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

onPeriodChange(event: Event): void {
  const selectedValue = (event.target as HTMLSelectElement).value; // Get the selected value
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
        this.unpaidInvoices = res.objectList;
        this.pager = res.pager;
        this.logger.info('unpaidInvoices',this.unpaidInvoices);
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

  lineChart() {
    this.logger.info('Initializing chart with top sales data:');
    this.logger.info('Initializing chart with top sales data:', this.topSales);

    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');
      
      this.lineChartData = {
        
        labels: Array.from({ length: this.topSales.map((m: any) => m.monthYear).length }, (_, i) => (this.months.find(m => m.key === this.topSales[i].monthYear.split('-')[0])?.value ?? '') + ' ' + this.topSales[i].monthYear.split('-')[1]), 
        datasets: [
          {
            label: 'Arbetskostnad',
            data: this.topSales.map((m: any) => Number(m.workSale)),
            fill: true,
            tension: 0.4,
            borderColor: documentStyle.getPropertyValue('--p-blue-500'),
            backgroundColor: 'rgba(56, 102, 255, 0.2)',
            pointBackgroundColor: 'blue',
            pointBorderColor: '#4F39F6',
            pointRadius: 0,
          },
          {
            label: 'Reservdelar',
            data: this.topSales.map((m: any) => Number(m.partsSale)),
            fill: true,
            tension: 0.4,
            borderColor: documentStyle.getPropertyValue('--p-green-500'),
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            pointBackgroundColor: 'green',
            pointBorderColor: 'green',
            pointRadius: 0,
          }
        ]
      };

      
  
      this.lineChartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems: TooltipItem<'line'>[]) => {
                return `Day ${tooltipItems[0]?.label ?? ''}`;
              },
              label: (tooltipItem: TooltipItem<'line'>) => {
                return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary,
            },
            grid: {
              display: false, // Hide y-axis labels
              color: surfaceBorder,
            }
          },
          y: {
            ticks: {
              display: true, // Hide y-axis labels
            },
            grid: {
              color: surfaceBorder,
            }
          }
        },
        elements: {
          point: {
            radius: (context: any) => {
              // 🎯 Only show the point when hovered
              return context.active ? 6 : 0;
            },
            hoverRadius: 6,
            hoverBackgroundColor: 'white',
            hoverBorderWidth: 2,
            hoverBorderColor: 'black'
          }
        },
        interaction: {
          mode: 'nearest', // Only activates when hovering near a point
          intersect: true
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
    redirectToProductCrudComponent() {
    this.router.navigate(['sv/product', {}]);
  }

 onPageChange(e:any){
    this.filters.patchValue({currentPage: e.page + 1,pageSize:e.rows });
    this.getUnpaidInvoices();
  }
  
  onPageSizeChange(event:SelectChangeEvent){
    this.filters.patchValue({pageSize:event.value });
    this.getUnpaidInvoices();
  }

  // sortColumn(e: any) {
  //   if (e) {
  //     let pageIndex = e.first / e.rows; 
  //     this.pager.firstPage = e.first;
  //     this.filters.patchValue({ currentPage: (++pageIndex).toString(),pageSize:e.rows,sortDir:e.sortOrder,sortBy:e.sortField});
  //     this.getInvoices();
  //   }
  //}
 

}