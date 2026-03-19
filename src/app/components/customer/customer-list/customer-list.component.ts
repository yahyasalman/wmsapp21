import { CommonModule } from '@angular/common';
import { Component, ViewChild, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { filter, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ICustomer, ICustomerTag, ICustomerType } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { CustomerService } from 'app/services/customer.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';


@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, IconFieldModule, InputIconModule, ProgressSpinnerModule, ButtonModule, SelectModule, TableModule, ToastModule, TooltipModule, InputTextModule],
  templateUrl: './customer-list.component.html'
})

export class CustomerListComponent implements OnInit, OnDestroy {

  // @ViewChild('dt') dataTable!: Table;

  customers: ICustomer[] = [];
  customerTags: ICustomerTag[] = [];
  customerTypes: ICustomerType[] = [];
  private destroy$ = new Subject<void>();

  customerCities: string[] = [];
  filters: FormGroup;
  currentPage: number = 1;
  isLoading: boolean = false;
  sortField = 'customerId';
  sortOrder = -1;
  
  constructor(
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly logger: LogService,
    private readonly errorHandler: ErrorHandlerService,
    public readonly sharedService: SharedService,
    private readonly customerService: CustomerService,
    private readonly route: ActivatedRoute,
    private readonly workshopService: WorkshopService,
    private readonly cdr: ChangeDetectorRef) {

    this.filters = this.fb.group({
      customerType: '',
      customerTag: '',
      customerCity: ''
    });
  }

  ngOnInit() {
    this.initializePage();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects.startsWith('/sv/customer')) {
          this.initializePage();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializePage() {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => { 
        this.sharedService.updateFiltersFromQueryParams(this.filters, params);
        this.logger.info('Query params applied, filters:', this.filters.value);
      });
    this.getCustomers();
    this.loadCustomerTags();
    this.loadCustomerTypes();
    this.getCustomerCities();

  }

  getCustomers() {
    this.isLoading = true;
    this.customerService
      .getCustomers(this.filters)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          this.customers = res;
          this.logger.info('getCustomers success', { count: this.customers.length, customers: this.customers });
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getCustomers', 'Failed to load customers. Please try again later.');
        }
      });
  }

  loadCustomerTags() {
    this.workshopService
      .getCustomerTags()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.customerTags = response;
            this.logger.info('loadCustomerTags success', { customerTags: this.customerTags });
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'loadCustomerTags', 'Failed to load customer tags.');
        }
      });
  }
  loadCustomerTypes() {
    this.workshopService
      .getCustomerTypes()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.customerTypes = response;
            this.logger.info('loadCustomerTypes success', { customerTypes: this.customerTypes });
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'loadCustomerTypes', 'Failed to load customer types.');
        }
      });
  }

  getCustomerCities() {
    this.customerService
      .getCustomerCities(this.filters)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.customerCities = res;
          this.logger.info('getCustomerCities success', { cities: this.customerCities });
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getCustomerCities', 'Failed to load cities.');
        }
      });
  }

  onPageChange(e: any) {

    this.logger.info('Page change event:', e.first,e.rows);
    const currentPage = (e.first / e.rows) + 1;
    this.logger.info('Current page calculated:', currentPage);
    this.sortField = e.sortField || this.sortField || 'customerId';
    this.sortOrder = (e.sortOrder !== undefined && e.sortOrder !== null)? e.sortOrder : this.sortOrder ?? 1;

    const oldSortBy = this.filters.get('sortBy')?.value;
    const oldSortDir = this.filters.get('sortDir')?.value;
    const isSortChanged = (this.sortField !== oldSortBy) || (this.sortOrder !== oldSortDir);
    const pageToSet = isSortChanged ? 1 : currentPage;
    this.filters.patchValue({currentPage: pageToSet, pageSize: e.rows,sortBy: this.sortField,sortDir: this.sortOrder });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }
  
  onChangeCustomerType(event: any) {
    if (!event.value)
      event.value = '';

    this.filters.patchValue({ currentPage: 1, customerType: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }

  onChangeCustomerTag(event: any) {
    if (!event.value)
      event.value = '';

    this.filters.patchValue({ currentPage: 1, customerTag: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }

  onChangeCustomerCity(event: any) {
    if (!event.value)
      event.value = '';

    this.filters.patchValue({ currentPage: 1, customerCity: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }

  onSelectCustomerName(event: any) {
    this.filters.patchValue({ currentPage: 1, customerName: event.value.customerName });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }

  keyupCustomerName(event: any) {
    if (event?.value) {
      this.filters.patchValue({ currentPage: 1, customerName: event.value, customerType: '', customerTag: '', customerCity: '' });
      this.sharedService.updateFiltersInNavigation(this.filters);
      this.getCustomers();
    }
  }
  onClearCustomerName() {
    this.filters.patchValue({ customerName: '', currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }
  onClearCustomerType() {
    this.filters.patchValue({ currentPage: 1, customerType: '' });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }
  onClearCustomerTag() {
    this.filters.patchValue({ currentPage: 1, customerTag: '' });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }
  onClearCustomerCity() {
    this.filters.patchValue({ currentPage: 1, customerCity: '' });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }

  redirectToCustomerDetailComponent(customerId: number) {
    this.router.navigate(['sv/customer/details', customerId]);
  }
  redirectToCustomerCrudComponent() {
    this.logger.info('Navigating to create new customer.');
    this.router.navigate(['sv/customer/crud', { customerId: 0 }]);

  }
}
