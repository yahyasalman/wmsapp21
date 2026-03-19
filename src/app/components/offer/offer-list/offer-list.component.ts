import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IPager, IOffer } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { OfferService } from 'app/services/offer.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectChangeEvent } from 'primeng/select';
import { catchError, filter, finalize, takeUntil, Subject } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { Validators } from '@angular/forms';
import { MessageModule } from 'primeng/message';
@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, IconFieldModule, InputIconModule, ProgressSpinnerModule, ButtonModule, SelectModule, DatePickerModule, AutoCompleteModule, InputNumberModule, ToastModule, ConfirmDialogModule, TableModule, TooltipModule, InputTextModule, ToggleButtonModule, TagModule, MessageModule],
  templateUrl: './offer-list.component.html',
  styleUrl: './offer-list.component.css',
  providers: [ConfirmationService, MessageService]
})
export class OfferListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sortField = 'offerId';
  sortOrder = -1;
  totalRecords: number = 0;
  
  offers: IOffer[] = [];
  pager: IPager = <IPager>{};
  totalSum: number = 0.00;
  totalNet: number = 0.00;
  totalVat: number = 0.00;
  vehiclePlates: any = [];
  selectedOffer: IOffer = <IOffer>{};
  validationMessage: string = '';
  selectedItem: any;
  filters: FormGroup;
  currentPage: number = 1;
  isLoading: boolean = true;
  constructor(private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly offerService: OfferService) {
    const currentDate = new Date();
    const oneYearBack = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());


    this.filters = this.fb.group({
      offerType: '',
      status: '',
      year: (currentDate.getFullYear()).toString(),
      fromDate: this.sharedService.getDateString(oneYearBack),//(currentDate.getFullYear()) + '-01-01',
      toDate: this.sharedService.getDateString(currentDate),
      vehiclePlate: '',
      customerId: 0,
      currentPage: 1,
      pageSize: 10,
      sortBy: this.sortField,
      sortDir: this.sortOrder
    });

  }

  ngOnInit() {
    this.initializePage();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects.startsWith('/sv/offer')) {
          this.initializePage();
        }
      });
  }
  initializePage() {

    this.route.queryParams.subscribe((params) => { this.sharedService.updateFiltersFromQueryParams(this.filters, params) });
    this.getOffers();

  }
  getOffers() {
    this.isLoading = true;
    this.logger.info('getOffers', this.filters.value);
    this.offerService
      .getOffers(this.filters)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          const objectData: any = res.objectList;
          this.offers = objectData;

          this.offers.forEach((offer) => {
            let offerTypeValue = 'pending';
            if (offer.isAccepted)
              offerTypeValue = 'accepted';
            else if (offer.isRejected)
              offerTypeValue = 'rejected';
            offer.selectedOfferType = offerTypeValue;
          });

          this.totalRecords = res.pager.totalRecords;
          this.totalSum = res.totalSum;
          this.totalVat = res.totalVat;
          this.totalNet = res.totalNet;
        },
        error: (err) => {
          this.logger.error('getOffers error', err);
        }
      });
  }

  // dropdwon start
  onSelectYear(selectedValue: any) {
    var selectedFromDate = selectedValue.getFullYear() + '-01-01';
    var selectedToDate = selectedValue.getFullYear() + '-12-31';
    this.filters.patchValue({ fromDate: selectedFromDate, toDate: selectedToDate, currentPage: 1 });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();
  }

  onChangeType(event: SelectChangeEvent) {
    this.filters.patchValue({ offerType: event.value, currentPage: 1 });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();
  }
  onChangeStatus(event: SelectChangeEvent) {
    this.filters.patchValue({ status: event.value, currentPage: 1 });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();
  }
  onSelectFromDate() {
    this.filters.patchValue({ currentPage: 1 });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();
  }
  onSelectToDate() {
    this.filters.patchValue({ currentPage: 1 });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();
  }
  onSelectNumberPlate(event: any) {
    // filters will automatically updated. Just reload filters
    this.filters.patchValue({ currentPage: 1 });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();
  }

  keyupNumberPlate(event: any) {
    if (event?.value) {
      this.offerService.getVehiclePlates(event?.value)
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response) => {
            this.logger.info(response);
            this.vehiclePlates = response;
          },
          error: (err) => {
            this.logger.error('keyupNumberPlate error', err);
          }
        });
    }
  }

  generatePdf(selectedOffer: any) {
    this.sharedService
      .printPdf('offer', selectedOffer.offerId.toString(), 'basic')
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            var newBlob = new Blob([response], { type: "application/pdf" });
            window.open(window.URL.createObjectURL(newBlob));
          }
        },
        error: (err) => {
          this.logger.error('generatePdf error', err);
        }
      });
  }

  onClearNumberPlate() {
    // implement
    this.filters.patchValue({ vehiclePlate: '' });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();
  }
  onClearOfferType() {
    this.filters.patchValue({ offerType: '' });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();

  }

  redirectToOfferDetailComponent(offerId: number) {
     this.router.navigate([`sv/offer/details/${offerId}`]);
  }


  redirectToOfferCrudComponent() {
    this.router.navigate(['sv/offer/crud', { offerId: 0 }]);
  }


  onPageSizeChange(event: SelectChangeEvent) {
    this.filters.patchValue({ currentPage: 1, pageSize: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOffers();
  }


  // onPageChange(e: any) {
  //   this.filters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
  //   this.sharedService.updateFiltersInNavigation(this.filters);
  //   this.getOffers();
  // }

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
      this.getOffers();
    }
  }


  confirmMarkAsSent(event: any, selectedOffer: any) {

    if (event.checked) {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: this.sharedService.T('sentConfirmMessage'),
        header: '',
        closable: false,
        closeOnEscape: false,
        rejectButtonProps: {
          label: this.sharedService.T('no'),
          severity: 'secondary',
        },
        acceptButtonProps: {
          label: this.sharedService.T('yes'),
        },
        accept: () => {
          this.offerService
            .markAsSent(selectedOffer.offerId)
            .pipe(
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: (res: any) => {
                if (res) {
                  this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('sentSuccessMessage') });
                  this.getOffers();
                }
                else {
                  this.messageService.add({ severity: 'error', summary: '', detail: this.sharedService.T('inv.sent.confirm.message.error') });
                }
              },
              error: (err) => {
                this.logger.error('confirmMarkAsSent error', err);
              }
            });
        },
        reject: () => {
          this.messageService.add({
            severity: 'error',
            summary: '',
            detail: this.sharedService.T('cancelled'),
            life: 3000,
          });
          this.getOffers();
        },
      });
    }
  }

  onOfferTypeChange(offer: IOffer, selectedValue: any): void {
    this.logger.info('selected offer type', offer, selectedValue);
    this.isLoading = true;
    this.offerService
      .getOffer(offer.offerId, undefined, false)
      .pipe(
        finalize(() => {
          // loading state managed by upsertOffer
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          this.logger.info('fetched offer', res);
          if (selectedValue == 'accepted') {
            res.data.isAccepted = true;
          }
          else if (selectedValue == 'rejected') {
            res.data.isRejected = true;
          }
          this.logger.info('updated offer', res);
          this.offerService
            .upsertOffer(res.data)
            .pipe(
              finalize(() => {
                this.isLoading = false;
              }),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: (res: any) => {
                if (res) {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: this.sharedService.T('Status updated successfully'),
                    life: 3000
                  });
                  this.logger.info('Offer updated', res);
                  this.getOffers();
                }
              },
              error: (err) => {
                this.logger.error('onOfferTypeChange upsertOffer error', err);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: this.sharedService.T('Failed to fetch offer details'),
                  life: 3000
                });
              }
            });
        },
        error: (err) => {
          this.logger.error('onOfferTypeChange getOffer error', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.sharedService.T('Failed to update status'),
            life: 3000
          });
          this.isLoading = false;
        }
      });
  }

  getSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'pending':
        return 'warn'; // Blue
      case 'accepted':
        return 'success'; // Yellow
      case 'rejected':
        return 'danger'; // Red
      default:
        return undefined; // Default case
    }
  }
  getFilteredOptions(offer: IOffer) {
    const allOptions = this.sharedService.getEnums('offerType');
    if (offer.selectedOfferType === 'pending') {
        return allOptions;
    } 
    return allOptions.filter(opt => opt.value === offer.selectedOfferType);
}
  onPageChange(e: any) {
    const currentPage = (e.first / e.rows) + 1;
    this.sortField = (e.sortField || this.sortField || 'invoiceId').trim();
    this.sortOrder = (e.sortOrder !== undefined && e.sortOrder !== null) ? Number(e.sortOrder) : (this.sortOrder ?? 1);
    const oldSortBy = this.filters.get('sortBy')?.value?.trim(); 
    const oldSortDir = Number(this.filters.get('sortDir')?.value); 
    const isSortChanged = (this.sortField !== oldSortBy) || (this.sortOrder !== oldSortDir);
    const pageToSet = isSortChanged ? 1 : currentPage;
    this.filters.patchValue({currentPage: pageToSet,pageSize: e.rows,sortBy: this.sortField,sortDir: this.sortOrder});
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.cdr.detectChanges();
    this.getOffers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

