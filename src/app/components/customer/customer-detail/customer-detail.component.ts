import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedService } from 'app/services/shared.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'app/services/customer.service';
import { ICustomer, IOffer, IWorkOrder } from 'app/app.model';
import { IInvoice, IInvoicePayment } from 'app/app.model';
import { IPager } from 'app/app.model';
import { finalize, takeUntil, catchError } from 'rxjs';
import { Subject } from 'rxjs';
import { InvoiceService } from 'app/services/invoice.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { SelectChangeEvent } from 'primeng/select';
import { OfferService } from 'app/services/offer.service'
import { LogService } from 'app/services/log.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WorkOrderService } from 'app/services/workorder.service';
import { BookingService } from 'app/services/booking.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    DialogModule,
    TooltipModule,
    TagModule,
    ToggleButtonModule,
    TabsModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css',
})
export class CustomerDetailComponent implements OnInit, OnDestroy {

  customer: ICustomer = <ICustomer>{};
  orders: IWorkOrder[] = [];
  offers: IOffer[] = [];
  invoices: IInvoice[] = [];
  private destroy$ = new Subject<void>();

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
              private readonly errorHandler: ErrorHandlerService,
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
    const customerId = Number(this.route.snapshot.paramMap.get('customerId'));
    this.getCustomer(customerId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  getCustomer(customerId:number) {
    this.isLoading = true;
    this.customerService
      .getCustomer(customerId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.customer = response.data;
            this.logger.info('getCustomer success', { customer: this.customer });
            this.getWorkOrders(this.customer.customerId);
            this.getOffers(this.customer.customerId);
            this.getInvoices(this.customer.customerId);
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getCustomer', 'Failed to load customer. Please try again later.');
        }
      });
  }

  // WorkOrder Methods

  getWorkOrders(customerId:number) {
    this.workOrderService
      .getWorkOrdersByCustomerId(customerId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.orders = res;
          this.logger.info('getWorkOrders success', { workOrderCount: this.orders.length, workOrders: this.orders });
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
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getWorkOrders', 'Failed to load work orders.');
        }
      });
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
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.logger.info('setWorkOrderStatus success', { workOrderId: workOrder.workOrderId });
            this.getWorkOrders(this.customer.customerId);
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'setWorkOrderStatus', 'Failed to update work order status.');
        }
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
            finalize(() => {
              this.isLoading = false;
            }),
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: (res: any) => {
              if (res) {
                this.logger.info('deleteBooking success', { workOrderId });
                this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('confirmSaveMessage') });
                this.getWorkOrders(this.customer.customerId);
              }
            },
            error: (err) => {
              this.errorHandler.handleError(err, 'deleteBooking', 'Failed to delete booking.');
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
      },
    });
  }

  // Offer Methods

  getOffers(customerId:number) {
    this.offerService
      .getOffersByCustomerId(customerId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.offers = res;
          this.logger.info('getOffers success', { offerCount: this.offers.length, offers: this.offers });
          this.offers.forEach((offer) => {
            let offerTypeValue = 'pending';
            if (offer.isAccepted)
              offerTypeValue = 'accepted';
            else if (offer.isRejected)
              offerTypeValue = 'rejected';
            offer.selectedOfferType = offerTypeValue;
          });

          // Nested Call
          this.offerService
            .offerSumByCustomer(this.customer.customerId)
            .pipe(
              finalize(() => {
                this.isLoading = false;
              }),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: (res) => {
                this.offerTotal = res.total;;
                this.offerAccepted = res.accepted;
                this.offerRejected = res.rejected;
                this.logger.info('offerSumByCustomer success', { total: this.offerTotal, accepted: this.offerAccepted, rejected: this.offerRejected });
              },
              error: (err) => {
                this.errorHandler.handleError(err, 'offerSumByCustomer', 'Failed to load offer summary.');
              }
            });
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getOffers', 'Failed to load offers.');
        }
      });
  }

  redirectToOfferDetailComponent(offerId: number, isSent: boolean, isAccepted: boolean, isRejected: boolean, customerId: number, customerEmail: string = '') {
    const disableEdit = isSent || isAccepted || isRejected;
    this.router.navigate([`sv/offer/details/${offerId}`]);

  }
  redirectToOfferCrudComponent() {
    this.router.navigate(['sv/offer/crud', { customerId: this.customer.customerId }]);
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
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (selectedValue == 'accepted') {
            res.isAccepted = true;
          }
          else if (selectedValue == 'rejected') {
            res.isRejected = true;
          }
          this.logger.info('onOfferTypeChange - offer loaded', { offerId: offer.offerId });
          
          // Nested Upsert call
          this.offerService
            .upsertOffer(res)
            .pipe(
              finalize(() => {
                this.isLoading = false;
              }),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: (res: any) => {
                if (res) {
                  this.logger.info('upsertOffer success', { offerId: offer.offerId });
                  this.getOffers(this.customer.customerId);
                }
              },
              error: (err) => {
                this.errorHandler.handleError(err, 'upsertOffer', 'Failed to update offer.');
              }
            });
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'onOfferTypeChange', 'Failed to load offer.');
        }
      });
  }


  // Invoice Methods
  getInvoices(customerId:number) {
    this.invoiceService
      .getInvoicesByCustomerId(customerId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.invoices = res;
          this.logger.info('getInvoicesByCustomerId success', { invoiceCount: this.invoices.length, invoices: this.invoices });
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getInvoices', 'Failed to load invoices.');
        }
      });

    // Secondary call - no loading control to avoid flickering
    this.invoiceService
      .invoiceSumByCustomer(this.customer.customerId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.invoiceTotal = res.total;;
          this.invoicePaid = res.paid;
          this.invoiceBalance = res.balance;
          this.logger.info('invoiceSumByCustomer success', { total: this.invoiceTotal, paid: this.invoicePaid, balance: this.invoiceBalance });
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'invoiceSumByCustomer', 'Failed to load invoice summary.');
        }
      });
  }

  getPayments(invoiceId: number) {
    this.isLoading = true;
    this.invoiceService
      .getInvoicePayments(invoiceId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.selectedPayments = res;
            this.logger.info('getInvoicePayments success', { paymentCount: this.selectedPayments.length, payments: this.selectedPayments });
            this.selectedTotalPaid = this.selectedPayments.reduce((sum: number, item: any) => {
              const amount = item?.paymentAmount || 0; // Ensure it's a number
              return sum + amount;
            }, 0);
            this.selectedRemainingBalance = this.selectedPriceIncvat - this.selectedTotalPaid;
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getPayments', 'Failed to load payments.');
        }
      });
  }

  redirectToInvoiceDetailComponent(isSent: boolean, isPaid: boolean, priceIncVat: number, customerId: number, customerEmail: string = '', invoiceId: number) {
    const creditInvoice = priceIncVat > 0 ? false : true;
    const disableEdit = isSent || isPaid || priceIncVat < 0;
    this.router.navigate([`sv/invoice/details/${invoiceId}`]);
  }

  redirectToInvoiceCrudComponent() {
    this.router.navigate(['sv/invoice/crud', { customerId: this.customer.customerId }]);
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
              finalize(() => {
                this.isLoading = false;
              }),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: (res: any) => {
                if (res) {
                  this.logger.info('markAsSent success', { invoiceId: selectedInvoice.invoiceId });
                  this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('sentSuccessMessage') });
                  this.getInvoices(this.customer.customerId);
                }
                else {
                  this.messageService.add({ severity: 'error', summary: '', detail: this.sharedService.T('emailSentConfirmMessageError') });
                }
              },
              error: (err) => {
                this.errorHandler.handleError(err, 'markAsSent', 'Failed to mark invoice as sent.');
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
          this.getInvoices(this.customer.customerId);
        },
      });
    }
  }

  generatePdfOffer(selectedOffer: any) {
    this.isLoading = true;
    this.sharedService
      .printPdf('offer', selectedOffer.offerId.toString(), 'basic')
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.logger.info('generatePdfOffer success', { offerId: selectedOffer.offerId });
            var newBlob = new Blob([response], { type: "application/pdf" });
            window.open(window.URL.createObjectURL(newBlob));
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'generatePdfOffer', 'Failed to generate PDF.');
        }
      });
  }

  generatePdfInvoice(selectedInvoice: any) {
    this.isLoading = true;
    this.sharedService
      .printPdf('invoice', selectedInvoice.invoiceId.toString(), 'basic')
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.logger.info('generatePdfInvoice success', { invoiceId: selectedInvoice.invoiceId });
            var newBlob = new Blob([response], { type: "application/pdf" });
            window.open(window.URL.createObjectURL(newBlob));
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'generatePdfInvoice', 'Failed to generate invoice PDF.');
        }
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
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          let minimunPaymentAmount = 0;
          this.addPaymentBtnDisabled = true;
          if (Number(res) > 0) {
            minimunPaymentAmount = 1;
            this.addPaymentBtnDisabled = false;
          }
          this.logger.info('deletePayment success', { invoiceId, paymentId, remainingBalance: res });
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
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'deletePayment', 'Failed to delete payment.');
        }
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
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          let minimunPaymentAmount = 0;
          this.addPaymentBtnDisabled = true;
          if (Number(res) > 0) {
            minimunPaymentAmount = 1;
            this.addPaymentBtnDisabled = false;
          }
          this.logger.info('onSave success', { paymentAmount: this.payment.get('paymentAmount')?.value, remainingBalance: res });
          this.payment.controls["paymentAmount"].setValidators([Validators.min(minimunPaymentAmount), Validators.max(Number(res))]);
          this.payment.patchValue({
            invoiceId: this.payment.get('invoiceId')?.value,
            paymentDate: this.sharedService.getDateString(new Date()),
            paymentAmount: Number(res),
            paymentNote: '',
            remainingBalance: Number(res)
          });
          this.getPayments(this.payment.get('invoiceId')?.value);
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'onSave', 'Failed to save payment.');
        }
      });
  }

  onCancel() {
    this.isDialogVisible = false;
  }

  onCloseDialog() {
    this.getCustomer(this.customer.customerId);
    this.getInvoices(this.customer.customerId);
  }

}