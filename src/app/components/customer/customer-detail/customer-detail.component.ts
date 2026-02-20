import { Component, OnInit } from '@angular/core';
import { SharedService } from 'app/services/shared.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'app/services/customer.service';
import { ICustomer, IOffer, IWorkOrder } from 'app/app.model';
import { IInvoice, IInvoicePayment } from 'app/app.model';
import { IPager } from 'app/app.model';
import { catchError } from 'rxjs';
import { InvoiceService } from 'app/services/invoice.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { SelectChangeEvent } from 'primeng/select';
import { OfferService } from 'app/services/offer.service'
import { LogService } from 'app/services/log.service';
import { RemovePlaceholderOnFocusDirective } from 'app/directives/remove-placeholder-on-focus.directive'
import { WorkOrderService } from 'app/services/workorder.service';
import { BookingService } from 'app/services/booking.service';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    RemovePlaceholderOnFocusDirective 
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css',
})
export class CustomerDetailComponent implements OnInit {

  customerId: number = 0;
  customer: ICustomer = <ICustomer>{};

  // Filters 
  workOrderFilters: FormGroup;
  offerFilters: FormGroup;
  invoiceFilters: FormGroup;
  // Objects

  orders: IWorkOrder[] = [];
  offers: IOffer[] = [];
  invoices: IInvoice[] = [];

  // Pagers

  workOrderPager: IPager = <IPager>{};
  offerPager: IPager = <IPager>{};
  invoicePager: IPager = <IPager>{};

  // Totals
  offerTotal: number = 0;
  offerAccepted: number = 0;
  offerRejected: number = 0;

  invoiceTotal: number = 0.00;
  invoicePaid: number = 0.00;
  invoiceBalance: number = 0.00;
  isLoading: boolean = false;

  addPaymentBtnDisabled: boolean = false;
  selectedPayments: IInvoicePayment[] = [];
  selectedTotalPaid: number = 0.00;
  selectedPriceIncvat: number = 0.00;
  selectedRemainingBalance: number = 0.00;
  selectedCustomerName: string = '';
  isDialogVisible: boolean = false;
  payment: FormGroup;
  
  // workorder 
  workOrderStatus: MenuItem[] = [];
  selectedWorkOrder: IWorkOrder = <IWorkOrder>{};
  constructor(private readonly logger: LogService,
              public readonly sharedService:SharedService,
              private router: Router,
               private readonly fb:FormBuilder,
              private readonly route: ActivatedRoute,
              private readonly customerService: CustomerService,
              private readonly offerService: OfferService,
              private readonly invoiceService: InvoiceService,
              private readonly workOrderService: WorkOrderService,
              private readonly bookingService: BookingService,
              private confirmationService: ConfirmationService,
              private messageService: MessageService
              ) {
                
                this.workOrderFilters = this.fb.group({customerId:this.customerId,currentPage:1,pageSize:10});
                this.offerFilters = this.fb.group({customerId:this.customerId,currentPage:1,pageSize:10});
                this.invoiceFilters = this.fb.group({customerId:this.customerId,currentPage:1,pageSize:10});
                this.payment = this.fb.group({
                      invoiceId:'',
                      paymentId:0,
                      paymentDate:[this.sharedService.getDateString(new Date()),Validators.required],
                      paymentAmount:[0,Validators.min(1)],
                      paymentNote:'',
                      remainingBalance:''
                    });

                 
  }
  ngOnInit() {
    this.customerId = Number(this.route.snapshot.paramMap.get('customerId'));
    this.getCustomer();
    this.getWorkOrders();
    this.getInvoices();
    this.getOffers();
  }


  getCustomer() {
    this.isLoading = true;
    this.customerService
      .getCustomer(this.customerId)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.customer = response.data;
          this.workOrderFilters.patchValue({ customerId: this.customerId });
          this.offerFilters.patchValue({ customerId: this.customerId });
          this.invoiceFilters.patchValue({ customerId: this.customerId });
        }
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });
  }

  // WorkOrder Methods

  getWorkOrders() {
    this.isLoading = true;
    this.workOrderService
      .getWorkOrders(this.workOrderFilters)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        this.orders = res.objectList;
        this.orders.forEach((order) => {
          order.workOrderDate = new Date(order.workOrderDate).toISOString().split('T')[0];
          this.workOrderStatus = [];

          if (order.workOrderStatus != 'completed') {
            this.sharedService.getEnums('workOrderStatus').forEach((status) => {
              if (status.value != 'booking' && status.value != order.workOrderStatus) {
                const copiedOrder = { ...order, workOrderStatus: status.value };
                this.workOrderStatus.push({ label: status.text, command: () => { this.setWorkOrderStatus(copiedOrder); } });
              }
            });
          }
        });
        this.workOrderPager = res.pager;
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });
  }

  sortWorkOrderTable(e: any) {
    if (e) {
      let pageIndex = e.first / e.rows;
      this.workOrderPager.firstPage = e.first;
      this.workOrderFilters.patchValue({ currentPage: (++pageIndex).toString(), pageSize: e.rows, sortDir: e.sortOrder, sortBy: e.sortField });
      this.getWorkOrders();
    }
  }

  onPageChangeWorkOrder(e: any) {
    this.workOrderFilters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
    this.getWorkOrders();
  }

  onPageSizeChangeWorkOrder(event: SelectChangeEvent) {
    this.workOrderFilters.patchValue({ pageSize: event.value });
    this.getWorkOrders();
  }

  getFilteredEnums(workOrderStatus: string) {
    let enums = this.sharedService.getEnums('workOrderStatus');
    let currentEnum = this.sharedService.getEnumByValue('workOrderStatus', workOrderStatus);
    return enums.filter(d => d.index >= currentEnum.index).sort((a, b) => a.index - b.index);
  }

  setWorkOrderStatus(workOrder: IWorkOrder) {
    this.isLoading = true;
    this.workOrderService
      .upsertWorkOrder(workOrder)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.getWorkOrders();
        }
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });
  }

  onStatusChange(workOrderId: number, newStatus: string) {
    let selectedWorkOrder: IWorkOrder | undefined = this.orders.find(workOrder => workOrder.workOrderId === workOrderId);
    if (selectedWorkOrder) {
      selectedWorkOrder.workOrderStatus = newStatus;
      this.setWorkOrderStatus(selectedWorkOrder);
    }
  }

  getSeverityWorkOrder(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'booking':
        return 'info'; // Blue
      case 'in-progress':
        return 'warn'; // Yellow
      case 'awaiting-parts':
        return 'danger'; // Red
      case 'completed':
        return 'success'; // Green
      default:
        return undefined; // Default case
    }
  }

  redirectToWorkOrderDetailComponent(workOrderId: number) {
    this.router.navigate(['sv/workorder/details', workOrderId]);
  }

  redirectToWorkOrderCrudComponent() {
    this.router.navigate(['sv/workorder/crud', { customerId: this.customer.customerId }]);
  }

  deleteBooking(workOrderId: number, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to this Booking?',
      header: '',
      closable: false,
      closeOnEscape: false,
      rejectButtonProps: {
        label: this.sharedService.T('confirmCancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.sharedService.T('confirmSave'),
      },
      accept: () => {
        this.isLoading = true;
        this.bookingService
          .deleteBooking(workOrderId)
          .pipe(
            catchError((err) => {
              this.isLoading = false;
              console.log(err);
              throw err;
            })
          )
          .subscribe((res: any) => {
            if (res) {
              this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('confirmSaveMessage') });
              this.getWorkOrders();
            }
            setTimeout(() => {
              this.isLoading = false;
            }, 500);
          });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: '',
          detail: this.sharedService.T('cancelled'),
          life: 3000,
        });
      },
    });
  }

  // Offer Methods

  getOffers() {
    this.isLoading = true;
    this.offerService
      .getOffers(this.offerFilters)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
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

        this.offerPager = res.pager;
        
        // Nested Call
        this.offerService
          .offerSumByCustomer(this.customerId)
          .pipe(
            catchError((err) => {
              this.isLoading = false;
              this.logger.error(err);
              throw err;
            })
          )
          .subscribe((res) => {
            this.offerTotal = res.total;;
            this.offerAccepted = res.accepted;
            this.offerRejected = res.rejected;
            
            // Turn off loading after everything is done
            setTimeout(() => {
              this.isLoading = false;
            }, 500);
          });
      });
  }

  redirectToOfferDetailComponent(offerId: number, isSent: boolean, isAccepted: boolean, isRejected: boolean, customerId: number, customerEmail: string = '') {
    const disableEdit = isSent || isAccepted || isRejected;
    this.sharedService.clearState();
    this.sharedService.setState({ disableEdit: disableEdit.toString(), creditInvoice: '', customerId: customerId, customerEmail: customerEmail });
    this.router.navigate([`sv/offer/details/${offerId}`]);

  }
  redirectToOfferCrudComponent() {
    this.router.navigate(['sv/offer/crud', { customerId: this.customer.customerId }]);
  }

  onPageChangeOffer(e: any) {
    this.offerFilters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
    this.getOffers();
  }

  onPageSizeChangeOffer(event: SelectChangeEvent) {
    this.offerFilters.patchValue({ pageSize: event.value });
    this.getOffers();
  }

  sortOfferTable(e: any) {
    if (e) {
      let pageIndex = e.first / e.rows;
      this.offerPager.firstPage = e.first;
      this.offerFilters.patchValue({ currentPage: (++pageIndex).toString(), pageSize: e.rows, sortDir: e.sortOrder, sortBy: e.sortField });
      this.getOffers();
    }
  }


  getSeverityOffer(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
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
  
  onOfferTypeChange(offer: IOffer, selectedValue: any): void {
    this.isLoading = true;
    this.offerService
      .getOffer(offer.offerId, undefined, false)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        if (selectedValue == 'accepted') {
          res.isAccepted = true;
        }
        else if (selectedValue == 'rejected') {
          res.isRejected = true;
        }
        
        // Nested Upsert call
        this.offerService
          .upsertOffer(res)
          .pipe(
            catchError((err) => {
              this.isLoading = false;
              console.log(err);
              throw err;
            })
          )
          .subscribe((res: any) => {
            if (res) {
              this.getOffers();
            }
            setTimeout(() => {
              this.isLoading = false;
            }, 500);
          });
      });
  }


  // Invoice Methods
  getInvoices() {
    this.isLoading = true;
    this.invoiceService
      .getInvoices(this.invoiceFilters)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        this.invoices = res.objectList;
        this.invoicePager = res.pager;
        
        // We handle the loading stop here for the main list
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });

    // We don't control main spinner with this secondary call to avoid flickering
    this.invoiceService
      .invoiceSumByCustomer(this.customerId)
      .pipe(
        catchError((err) => {
          // No isLoading=false here, let the main list handle it
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        this.invoiceTotal = res.total;;
        this.invoicePaid = res.paid;
        this.invoiceBalance = res.balance;
      });
  }

  getPayments(invoiceId: number) {
    this.isLoading = true;
    this.invoiceService
      .getInvoicePayments(invoiceId)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.selectedPayments = res;
          this.selectedTotalPaid = this.selectedPayments.reduce((sum: number, item: any) => {
            const amount = item?.paymentAmount || 0; // Ensure it's a number
            return sum + amount;
          }, 0);
          this.selectedRemainingBalance = this.selectedPriceIncvat - this.selectedTotalPaid;
        }
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });
  }

  redirectToInvoiceDetailComponent(isSent: boolean, isPaid: boolean, priceIncVat: number, customerId: number, customerEmail: string = '', invoiceId: number) {
    const creditInvoice = priceIncVat > 0 ? false : true;
    const disableEdit = isSent || isPaid || priceIncVat < 0;
    this.sharedService.clearState();
    this.sharedService.setState({ disableEdit: disableEdit.toString(), creditInvoice: creditInvoice.toString(), customerId: customerId, customerEmail: customerEmail });
    this.router.navigate([`sv/invoice/details/${invoiceId}`]);
  }

  redirectToInvoiceCrudComponent() {
    this.router.navigate(['sv/invoice/crud', { customerId: this.customerId }]);
  }

  redirectToCustomerCrudComponent() {
    this.router.navigate([`sv/customer/crud`, { customerId: this.customer.customerId }]);
  }

  confirmMarkAsSent(event: any, selectedInvoice: any) {
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
          this.isLoading = true;
          this.invoiceService
            .markAsSent(selectedInvoice.invoiceId)
            .pipe(
              catchError((err) => {
                this.isLoading = false;
                console.log(err);
                throw err;
              })
            )
            .subscribe((res: any) => {
              if (res) {
                this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('sentSuccessMessage') });
                this.getInvoices();
              }
              else {
                this.messageService.add({ severity: 'error', summary: '', detail: this.sharedService.T('emailSentConfirmMessageError') });
              }
              setTimeout(() => {
                this.isLoading = false;
              }, 500);
            });
        },
        reject: () => {
          this.messageService.add({
            severity: 'error',
            summary: '',
            detail: this.sharedService.T('cancelled'),
            life: 3000,
          });
          this.getInvoices();
        },
      });
    }
  }

  generatePdfOffer(selectedOffer: any) {
    this.isLoading = true;
    this.sharedService
      .printPdf('offer', selectedOffer.offerId.toString(), 'basic')
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          var newBlob = new Blob([response], { type: "application/pdf" });
          window.open(window.URL.createObjectURL(newBlob));
        }
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });
  }

  onPageChangeInvoice(e: any) {
    this.invoiceFilters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
    this.getInvoices();
  }

  onPageSizeChangeInvoice(event: SelectChangeEvent) {
    this.invoiceFilters.patchValue({ pageSize: event.value });
    this.getInvoices();
  }

  sortInvoiceTable(e: any) {
    if (e) {
      let pageIndex = e.first / e.rows;
      this.invoicePager.firstPage = e.first;
      this.invoiceFilters.patchValue({ currentPage: (++pageIndex).toString(), pageSize: e.rows, sortDir: e.sortOrder, sortBy: e.sortField });
      this.getInvoices();
    }
  }

  generatePdfInvoice(selectedInvoice: any) {
    this.isLoading = true;
    this.sharedService
      .printPdf('invoice', selectedInvoice.invoiceId.toString(), 'basic')
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          var newBlob = new Blob([response], { type: "application/pdf" });
          window.open(window.URL.createObjectURL(newBlob));
        }
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });
  }


  // payment 

  // dialog start

  showPaymentDialog(selectedInvoice: IInvoice) {
    this.selectedCustomerName = selectedInvoice.customerName;
    this.selectedPriceIncvat = selectedInvoice.priceIncVat;
    this.selectedRemainingBalance = selectedInvoice.remainingBalance;
    this.selectedTotalPaid = selectedInvoice.totalPaid;
    this.isDialogVisible = true;


    if (selectedInvoice.remainingBalance > 0) {
      this.payment.controls["paymentAmount"].setValidators([Validators.min(1), Validators.max(selectedInvoice.remainingBalance)]);
      this.addPaymentBtnDisabled = false;
    }
    else {
      this.payment.controls["paymentAmount"].setValidators([Validators.min(0), Validators.max(0)]);
      this.addPaymentBtnDisabled = true;
    }
    this.payment.patchValue({
      invoiceId: selectedInvoice.invoiceId,
      paymentDate: this.sharedService.getDateString(new Date()),
      paymentAmount: selectedInvoice.remainingBalance,
      paymentNote: '',
      remainingBalance: selectedInvoice.remainingBalance
    });
    this.getPayments(selectedInvoice.invoiceId);
  }

  onPaymentDateChange(e: any) {
    this.payment.patchValue({ paymentDate: this.sharedService.getDateString(e) });
  }

  confirmDeletePayment(event: Event, invoiceId: number, paymentId: number) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.sharedService.T('paymentDeleteConfirmMessage'),
      header: this.sharedService.T('delete') + ' ' + this.sharedService.T('payment'),
      icon: 'pi pi-info-circle',
      rejectLabel: this.sharedService.T('no'),
      rejectButtonProps: {
        label: this.sharedService.T('no'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.sharedService.T('yes'),
        severity: 'danger',
      },

      accept: () => {
        this.deletePayment(invoiceId, paymentId);
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: this.sharedService.T('cancelled'), detail: this.sharedService.T('cancelled') });
      },
    });
  }

  deletePayment(invoiceId: number, paymentId: number) {
    this.isLoading = true;
    this.invoiceService
      .deleteInvoicePayment(invoiceId, paymentId)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          this.messageService.add({ severity: 'error', summary: this.sharedService.T('error'), detail: this.sharedService.T('errorMessage') });
          throw err;
        })
      )
      .subscribe((res) => {
        let minimunPaymentAmount = 0;
        this.addPaymentBtnDisabled = true;
        if (Number(res) > 0) {
          minimunPaymentAmount = 1;
          this.addPaymentBtnDisabled = false;
        }
        this.payment.controls["paymentAmount"].setValidators([Validators.min(minimunPaymentAmount), Validators.max(Number(res))]);
        this.payment.patchValue({
          invoiceId: this.payment.get('invoiceId')?.value,
          paymentDate: this.sharedService.getDateString(new Date()),
          paymentAmount: Number(res),
          paymentNote: '',
          remainingBalance: Number(res)
        });
        this.getPayments(this.payment.get('invoiceId')?.value);
        this.messageService.add({ severity: 'info', detail: this.sharedService.T('paymentDeleteConfirmMessageSave') });
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });
  }

  redirectToCustomerDetailComponent(selectedInvoice: any) {
    let url = 'sv/customer/details/' + selectedInvoice.customerId;
    this.router.navigate([url]);
  }


  onSave() {
    if (this.payment.invalid) {
      this.payment.markAllAsTouched();
      return;
    }
    this.addPaymentBtnDisabled = true;
    this.isLoading = true;
    this.invoiceService
      .createInvoicePayment(this.payment.value)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        let minimunPaymentAmount = 0;
        this.addPaymentBtnDisabled = true;
        if (Number(res) > 0) {
          minimunPaymentAmount = 1;
          this.addPaymentBtnDisabled = false;
        }
        this.payment.controls["paymentAmount"].setValidators([Validators.min(minimunPaymentAmount), Validators.max(Number(res))]);
        this.payment.patchValue({
          invoiceId: this.payment.get('invoiceId')?.value,
          paymentDate: this.sharedService.getDateString(new Date()),
          paymentAmount: Number(res),
          paymentNote: '',
          remainingBalance: Number(res)
        });
        this.getPayments(this.payment.get('invoiceId')?.value);
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      });
  }

  onCancel() {
    this.isDialogVisible = false;
  }

  onCloseDialog() {
    this.getCustomer();
    this.getInvoices();
  }

}