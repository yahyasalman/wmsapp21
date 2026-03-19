import { Component, OnInit, PLATFORM_ID, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import {Router } from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {IInvoice,IOffer, IOutStandingBalance, IPager, ITopCustomer, ITopManufacturer, ITopSale, IUnpaidInvoice } from 'app/app.model';
import { LogService } from 'app/services/log.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SharedService } from 'app/services/shared.service';
import { DashboardService } from 'app/services/dashboard.service';
import { InvoiceService } from 'app/services/invoice.service';
import {TooltipItem } from 'chart.js';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

// RxJS
import { catchError, forkJoin, Subject, finalize } from 'rxjs';

@Component({
  selector: 'app-dashboard-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    TableModule,
    ChartModule,
    ProgressSpinnerModule,
    ProgressBarModule,
    CardModule,
    InputNumberModule,
    DialogModule,
    TooltipModule,
    TagModule
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
  
  topSales:ITopSale[] = [];
  topCustomers:ITopCustomer[] = [];
  topManufacturers:ITopManufacturer[] = [];
  outStandingInvoices:IOutStandingBalance = {priceIncVat:0.00,vat:0.00,orderCount:0};
  outStandingOffers:IOutStandingBalance = {priceIncVat:0.00,vat:0.00,orderCount:0};
  
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
  platformId = inject(PLATFORM_ID);
  isLoading:boolean = false;
percentage: number = 0;

  noOfPreviousMonthsForChart:any[] = [];
  selectedStatMonths = '3';
  private destroy$ = new Subject<void>();
  private observers: MutationObserver[] = [];
  
  constructor(private cd: ChangeDetectorRef,
              private readonly router: Router,
              private readonly fb:FormBuilder, 
              private readonly logger: LogService,
              private readonly errorHandler: ErrorHandlerService,
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
   this.noOfPreviousMonthsForChart = [
            { value:'3',text:this.sharedService.T('previous3Months')},
            { value:'6',text:this.sharedService.T('previous6Months')},
            { value:'12',text:this.sharedService.T('previousYear')},
        ];
          
    this.loadDashboardCards();
    this.loadCurrentMonthStats();
    this.loadLineChart("3");
    this.getUnpaidInvoices();
    this.getWaitingOffers();
    this.listenForThemeChanges();
    
  }


  ngOnDestroy(): void {
    // Disconnect all DOM observers to prevent memory leaks
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    this.destroy$.next();
    this.destroy$.complete();
  }

private loadMonths(): void {
  this.months = this.monthKeys.map((key) => ({
    key,
    value: this.sharedService.T(key) 
  }));
}

loadDashboardCards(): void {
  this.isLoading = true;

  forkJoin({
    outStandingOffers: this.dashboardService.getOutStandingOffers(),
    outStandingInvoices: this.dashboardService.getOutStandingInvoices(),
    topManufacturers: this.dashboardService.getTopManufacturers(),
    topCustomers: this.dashboardService.getTopCustomers(),
  })
    .pipe(
      finalize(() => {
        this.isLoading = false; // Ensure loading state is updated
      })
    )
    .subscribe({
      next: (results) => {
        this.outStandingOffers = results.outStandingOffers;
        this.outStandingInvoices = results.outStandingInvoices;
        this.topManufacturers = results.topManufacturers;
        this.topCustomers = results.topCustomers;

        this.logger.info('Dashboard Cards Loaded', results);
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'loadDashboardCards', 'Failed to load dashboard data. Please try again later.');
      },
    });
}

private getCurrentOrPreviousMonth(): { year: number; month: number; monthName: string } {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  let year = currentDate.getFullYear();
  let month = currentDate.getMonth() + 1; // 1-based month

  if (currentDay < 10) {
    month -= 1; // Go to the previous month
    if (month === 0) {
      month = 12; // Wrap around to December
      year -= 1;
    }
  }

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  return { year, month, monthName };
}

private calculatePercentage(value: number, total: number): number {
  if (total > 0) {
    return Math.min((value / total) * 100, 100); // Cap percentage at 100
  }
  return 0; // Handle division by zero
}


loadCurrentMonthStats(): void {
  const { year, month, monthName } = this.getCurrentOrPreviousMonth();
  this.selectedMonth = `${monthName} ${year}`;
  this.isLoading = true;
  forkJoin({
    currentMonthSaleTarget: this.dashboardService.getMonthSaleTarget(year.toString(), month.toString()),
    currentMonthSale: this.dashboardService.getMonthSale(year.toString(), month.toString()),
    currentMonthOrders: this.dashboardService.getMonthOrders(year.toString(), month.toString()),
    currentMonthOffers: this.dashboardService.getMonthOffers(year.toString(), month.toString()),
    currentMonthDigitalServices: this.dashboardService.getMonthDigitalServices(year.toString(), month.toString()),
    currentMonthWorkOrders: this.dashboardService.getMonthWorkOrders(year.toString(), month.toString()),
    currentMonthCustomers: this.dashboardService.getMonthCustomers(year.toString(), month.toString()),
  })
    .pipe(
      finalize(() => {
        this.isLoading = false; // Ensure loading state is updated
      })
    )
    .subscribe({
      next: (results) => {
        // Assign results to properties
        this.currentMonthSaleTarget = Number(results.currentMonthSaleTarget);
        this.currentMonthSale = Number(results.currentMonthSale);
        this.currentMonthOrders = results.currentMonthOrders;
        this.currentMonthOffers = results.currentMonthOffers;
        this.currentMonthDigitalServices = results.currentMonthDigitalServices;
        this.currentMonthWorkOrders = results.currentMonthWorkOrders;
        this.currentMonthCustomers = results.currentMonthCustomers;

        // Calculate progress percentage
        this.progressPercentage = this.calculatePercentage(
          this.currentMonthSale,
          this.currentMonthSaleTarget
        );

        // Log results in a structured way
        this.logger.info('Current Month Stats:', {
          saleTarget: this.currentMonthSaleTarget,
          sale: this.currentMonthSale,
          orders: this.currentMonthOrders,
          offers: this.currentMonthOffers,
          digitalServices: this.currentMonthDigitalServices,
          workOrders: this.currentMonthWorkOrders,
          customers: this.currentMonthCustomers,
          progressPercentage: this.progressPercentage,
        });
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'loadCurrentMonthStats', 'Failed to load current month statistics. Please try again later.');
      },
    });
}

  getAverageperOrder(): number {
  const sale = Number(this.currentMonthSale);
  const orders = Number(this.currentMonthOrders);
  return orders > 0 ? sale / orders : 0;
}


getUnpaidInvoices(): void {
  this.isLoading = true;

  this.logger.info('getUnpaidInvoices called', { filters: this.filters.value });

  this.dashboardService
    .getUnpaidInvoices(this.filters)
    .pipe(
      finalize(() => {
        this.isLoading = false; // Ensure loading state is updated
      })
    )
    .subscribe({
      next: (res) => {
        this.unpaidInvoices = res;
        this.logger.info('getUnpaidInvoices success', { unpaidInvoices: this.unpaidInvoices });
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'getUnpaidInvoices', 'Failed to load unpaid invoices. Please try again later.');
      },
    });
}

  getWaitingOffers(): void {
  this.isLoading = true;
  this.logger.info('getWaitingOffers called', { filters: this.filters.value });
  this.dashboardService
    .getWaitingOffers()
    .pipe(
      finalize(() => {
        this.isLoading = false; // Ensure loading state is updated
      })
    )
    .subscribe({
      next: (res) => {
        this.waitingOffers = res;
        this.logger.info('getWaitingOffers success', { waitingOffers: this.waitingOffers });
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'getWaitingOffers', 'Failed to load waiting offers. Please try again later.');
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
loadLineChart(noOfPreviousMonths:string){
  this.dashboardService
  .getTopSales(noOfPreviousMonths)
  .subscribe({
    next: (res) => {
      this.topSales = res;
      this.logger.info('Top Sales Data:', this.topSales);
      this.loadMonths(); // Call synchronous method directly
      this.lineChart();
    },
    error: (err) => {
      this.errorHandler.handleError(err, 'loadLineChart', 'Failed to load top sales data. Please try again later.');
    },
  });

}

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
    private listenForThemeChanges(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const dynamicStyleEl = document.getElementById('dynamic-primary');
    if (dynamicStyleEl) {
      const observer = new MutationObserver(() => {
        if (this.topSales && this.topSales.length > 0) {
          setTimeout(() => { 
            this.lineChart();
            this.cd.markForCheck();
          }, 50);
        }
      });
      // Observe text content changes in the style element
      observer.observe(dynamicStyleEl, {
        childList: true,    
        characterData: true,
        subtree: true       
      });
      // Store observer to disconnect later
      this.observers.push(observer);
    }
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
    // Store observer to disconnect later
    this.observers.push(rootObserver);
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