import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { catchError, filter, of, switchMap } from 'rxjs';
import { SHARED_IMPORTS } from '../../../sharedimports';
import { ICustomer, ICustomerTag, ICustomerType, IEnum, IPager } from 'app/app.model';
import { SharedService, CustomerService, LogService, WorkshopService } from 'app/services';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';



@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [...SHARED_IMPORTS, GenericLoaderComponent,],
  templateUrl: './customer-list.component.html'
})

export class CustomerListComponent {

  customers: ICustomer[] = [];
  pager: IPager = <IPager>{};
  customerTags: ICustomerTag[] = [];
  customerTypes: ICustomerType[] = [];

  customerCities: string[] = [];
  filters: FormGroup;
  currentPage: number = 1;
  isLoading: boolean = false;

  constructor(
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly logger: LogService,
    public readonly sharedService: SharedService,
    private readonly customerService: CustomerService,
    private readonly route: ActivatedRoute,
    private readonly workshopService: WorkshopService) {


    this.filters = this.fb.group({
      customerType: '',
      customerTag: '',
      customerCity: '',
      customerName: '',
      currentPage: 1,
      pageSize: 10,
      sortBy: '',
      sortDir: ''
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
    this.route.queryParams.subscribe((params) => { this.sharedService.updateFiltersFromQueryParams(this.filters, params) });
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
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        const objectData: any = res.objectList;
        this.customers = objectData;
        this.pager = res.pager;
      });
    setTimeout(() => {
      this.isLoading = false;

    }, 800);
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

  onPageSizeChange(event: any) {
    this.filters.patchValue({ currentPage: 1, pageSize: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }
  onPageChange(e: any) {
    this.filters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getCustomers();
  }

  sortColumn(e: any) {
    if (e) {
      let pageIndex = e.first / e.rows;
      // If the current page is already set, use it instead of resetting
      if (this.filters.get('currentPage')?.value) {
        pageIndex = +this.filters.get('currentPage')?.value - 1; // Convert to zero-based index
      }
      // Update the pager and filters
      this.pager.firstPage = e.first;
      this.filters.patchValue({
        currentPage: (pageIndex + 1).toString(), // Convert back to one-based index
        pageSize: e.rows,
        sortDir: e.sortOrder,
        sortBy: e.sortField,
      });
      this.sharedService.updateFiltersInNavigation(this.filters);
      this.getCustomers();
    }
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
