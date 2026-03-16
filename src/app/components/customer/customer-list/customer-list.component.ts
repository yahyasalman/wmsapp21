import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { catchError, filter, of, switchMap } from 'rxjs';
import { SHARED_IMPORTS } from '../../../sharedimports';
import { ICustomer, ICustomerTag, ICustomerType, IEnum, IPager } from 'app/app.model';
import { SharedService, CustomerService, LogService, WorkshopService } from 'app/services';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Table } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';


@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [...SHARED_IMPORTS, IconFieldModule, InputIconModule, ProgressSpinnerModule],
  templateUrl: './customer-list.component.html'
})

export class CustomerListComponent {

  // @ViewChild('dt') dataTable!: Table;

  customers: ICustomer[] = [];
  customerTags: ICustomerTag[] = [];
  customerTypes: ICustomerType[] = [];

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
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects.startsWith('/sv/customer')) {
          this.initializePage();
        }
      });
  }

  initializePage() {
    this.route.queryParams.subscribe((params) => { 
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
        catchError((err) => {
          this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
       
        this.customers = res;
        this.logger.info(this.customers);
        this.logger.info(`Fetched ${this.customers.length} customers.`);
        this.isLoading = false;
      });
  }

  loadCustomerTags() {
    this.isLoading = true;
    this.workshopService
      .getCustomerTags()
      .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response)
          this.customerTags = response;
      });
    this.isLoading = false;
  }
  loadCustomerTypes() {
    this.isLoading = true;
    this.workshopService
      .getCustomerTypes()
      .pipe(catchError((err) => {
        this.isLoading = false;
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response)
          this.customerTypes = response;
      });
    this.isLoading = false;
  }

  getCustomerCities() {
    this.isLoading = true;
    this.customerService
      .getCustomerCities(this.filters)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        this.customerCities = res;
      });
    this.isLoading = false;
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
    

     setTimeout(() => {
      this.getCustomers();
     }, 0);
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
