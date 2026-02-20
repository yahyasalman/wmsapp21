import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute,NavigationEnd, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { RemovePlaceholderOnFocusDirective } from 'app/directives/remove-placeholder-on-focus.directive';
import { IPager, IInvoice, IInvoicePayment } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { InvoiceService } from 'app/services/invoice.service';
import { LogService } from 'app/services/log.service';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { SelectChangeEvent } from 'primeng/select';
import { catchError, filter, firstValueFrom, map, switchMap } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';


@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    RemovePlaceholderOnFocusDirective,
    GenericLoaderComponent
  ],  
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.css',
  providers: [ConfirmationService,MessageService]
})
export class InvoiceListComponent implements OnInit {
   
  
  invoices: IInvoice[] = [];
  pager:IPager = <IPager>{};
  totalSum:number = 0.00;
  totalNet:number = 0.00;
  totalVat:number = 0.00;
  vehiclePlates:any=[];
  filters:FormGroup;
  currentPage:number = 1;
  isLoading:boolean = false;
  selectedPayments:IInvoicePayment[] = [];
  selectedTotalPaid:number = 0.00;
  selectedPriceIncvat:number = 0.00;
  selectedRemainingBalance:number = 0.00;
  selectedCustomerName:string = '';
  isDialogVisible: boolean = false;

  payment:FormGroup;
  
  checked:boolean = true;
  emailsent:any = new FormArray([]);
  addPaymentBtnDisabled:boolean = false;

  constructor(private logger: LogService,
              public readonly sharedService:SharedService,
              private router: Router,
              private readonly route: ActivatedRoute,
              private readonly fb:FormBuilder,
              private readonly invoiceService: InvoiceService,
              private confirmationService: ConfirmationService,
              private messageService: MessageService,){

const currentDate = new Date();
const oneYearBack = new Date(currentDate.getFullYear() - 1,currentDate.getMonth(),currentDate.getDate());
   this.filters = this.fb.group({
      type:null,
      status:null,
      year:(currentDate.getFullYear()).toString(),
      fromDate: this.sharedService.getDateString(oneYearBack),//(currentDate.getFullYear()) + '-01-01',
      toDate: this.sharedService.getDateString(currentDate),
      vehiclePlate:null,
      customerId:null,
      currentPage:1,
      pageSize:10,
      sortBy:null,
      sortDir:'-1'
    });
    
    this.payment = this.fb.group({
      invoiceId:'',
      invoicePaymentId:0,
      paymentDate:[this.sharedService.getDateString(new Date()),Validators.required],
      paymentAmount:[0,Validators.min(1)],
      paymentNote:'',
      remainingBalance:''
    });

  }  

ngOnInit(){
  this.initializePage();
  this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects.startsWith('/sv/invoice')) {
          this.logger.info('url detedted');
          this.initializePage(); 
        }
      });
  }
  initializePage()
  {
    console.trace('initializePage called'); // Debugging: Trace where this is called
    this.route.queryParams.subscribe((params) => {this.sharedService.updateFiltersFromQueryParams(this.filters, params)});
    this.getInvoices();
 }

  getInvoices() {
    this.logger.info('getInvoices',this.filters.value);
     this.isLoading=true;
    this.invoiceService
      .getInvoices(this.filters)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        //const objectData:any = res.objectList;
        this.invoices = res.objectList;
        this.pager = res.pager;
        this.totalSum = res.totalSum;
        this.totalNet = res.totalNet;
        this.totalVat = res.totalVat;
         setTimeout(() => {
        this.isLoading = false;
      }, 800);
      });
  }

  getPayments(invoiceId:number) {
    this.invoiceService
      .getInvoicePayments(invoiceId)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        if(res)
        {
          this.selectedPayments = res;
          this.selectedTotalPaid = this.selectedPayments.reduce((sum: number, item: any) => {
            const amount = item?.paymentAmount || 0; // Ensure it's a number
            return sum + amount;
          }, 0);
          this.selectedRemainingBalance = this.selectedPriceIncvat -this.selectedTotalPaid;
        }
      });
  }

  onSelectYear(selectedValue:any){
    var selectedFromDate = selectedValue.getFullYear() + '-01-01';
    var selectedToDate = selectedValue.getFullYear() + '-12-31';

    this.filters.patchValue({currentPage:1,fromDate: selectedFromDate,toDate: selectedToDate});
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  }

  onChangeType(event:SelectChangeEvent){
    this.filters.patchValue({currentPage:1,type: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  }
  onChangeStatus(event:SelectChangeEvent){
    this.filters.patchValue({currentPage:1,status: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  }

  onSelectFromDate(selectedFromDate:Date){
    this.filters.patchValue({currentPage:1,fromDate: this.sharedService.getDateString(selectedFromDate)});
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  }
  
  onSelectToDate(selectedToDate:Date){
    this.filters.patchValue({currentPage:1,toDate: this.sharedService.getDateString(selectedToDate) });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  }
  onSelectNumberPlate(event:any){
    this.filters.patchValue({currentPage:1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  }

  keyupNumberPlate(event:any){
    if(event?.value)
    {
      this.invoiceService.getVehiclePlates(event?.value)
      .subscribe((response)=>{
        this.vehiclePlates = response;
      });    
    }
  }
  
  onClearNumberPlate(){
    this.filters.patchValue({vehiclePlate: '' });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  }

  onClearInvoiceType(){
    // implement
    this.filters.patchValue({type: '' });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  } 
   
  confirmMarkAsSent(event: any,selectedInvoice:any) {
    
    if(event.checked)
    {
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
            this.invoiceService
                .markAsSent(selectedInvoice.invoiceId)
                .pipe(
                  catchError((err) => {
                    console.log(err);
                    throw err;
                  })
                )
                .subscribe((res: any) => {
                  if (res) {
                    this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('sentConfirmMessage') });
                    this.getInvoices();
                  }
                  else 
                  {
                    this.messageService.add({ severity: 'error', summary: '', detail: this.sharedService.T('sentErrorMessage') });
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
            this.getInvoices();
        },
    });
  }
  } 
  redirectToInvoiceDetailComponent(invoiceId: number) {
    this.router.navigate([`sv/invoice/details/${invoiceId}`]);
  }
  redirectToInvoiceCrudComponent() {
    this.router.navigate([`sv/invoice/crud`]);
  }
  
  onPageChange(e:any){
    this.filters.patchValue({currentPage: e.page + 1,pageSize:e.rows });
    this.sharedService.updateFiltersInNavigation(this.filters);    
    this.getInvoices();
  }
  
  onPageSizeChange(event:SelectChangeEvent){
    this.filters.patchValue({ currentPage:1,pageSize: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getInvoices();
  }

sortColumn(e: any) {
  if (e) {
    let pageIndex = e.first / e.rows;
    if (this.filters.get('currentPage')?.value) {
      pageIndex = +this.filters.get('currentPage')?.value - 1; // Convert to zero-based index
    }
    this.pager.firstPage = e.first;
    this.filters.patchValue({
      currentPage: (pageIndex + 1).toString(), // Convert back to one-based index
      pageSize: e.rows,
      sortDir: e.sortOrder,
      sortBy: e.sortField,
    });
      this.sharedService.updateFiltersInNavigation(this.filters);
      this.getInvoices();
  }
}


  // dialog start

  showPaymentDialog(selectedInvoice:IInvoice) {
    this.selectedCustomerName = selectedInvoice.customerName;
    this.selectedPriceIncvat = selectedInvoice.priceIncVat;
    this.selectedRemainingBalance = selectedInvoice.remainingBalance;
    this.selectedTotalPaid  = selectedInvoice.totalPaid;
    this.isDialogVisible = true;
    
    if(selectedInvoice.remainingBalance > 0 )
    {
    this.payment.controls["paymentAmount"].setValidators([Validators.min(1), Validators.max(selectedInvoice.remainingBalance)]);
    this.addPaymentBtnDisabled = false;    
    }
    else 
    {
      this.payment.controls["paymentAmount"].setValidators([Validators.min(0), Validators.max(0)]);
      this.addPaymentBtnDisabled = true;  
    }
    this.payment.patchValue({invoiceId:selectedInvoice.invoiceId,
                             paymentDate:this.sharedService.getDateString(new Date()),
                             paymentAmount: selectedInvoice.remainingBalance,
                             paymentNote:'',
                             remainingBalance:selectedInvoice.remainingBalance });
                            this.getPayments(selectedInvoice.invoiceId);
  }

  onPaymentDateChange(e:any){
    this.payment.patchValue({paymentDate:this.sharedService.getDateString(e)});
  }
  
  confirmDeletePayment(event:Event,invoiceId:number,paymentId:number){
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
              this.deletePayment(invoiceId,paymentId);
          },
          reject: () => {
              this.messageService.add({ severity: 'error', summary: this.sharedService.T('cancelled'), detail: this.sharedService.T('cancelled') });
          },
      });
    }
  
  deletePayment(invoiceId:number,paymentId:number)
   {   
    this.invoiceService
    .deleteInvoicePayment(invoiceId,paymentId)
    .pipe(
      catchError((err) => {
        this.messageService.add({ severity: 'error', summary: this.sharedService.T('error'), detail: this.sharedService.T('errormessage') }); 
        throw err;
      })
    )
    .subscribe((res) => {
      let minimunPaymentAmount = 0;
      this.addPaymentBtnDisabled = true;
      if(Number(res) > 0 )
      {
        minimunPaymentAmount = 1;
        this.addPaymentBtnDisabled = false;
      }
      this.payment.controls["paymentAmount"].setValidators([Validators.min(minimunPaymentAmount), Validators.max(Number(res))]);
      this.payment.patchValue({invoiceId:this.payment.get('invoiceId')?.value,
                               paymentDate:this.sharedService.getDateString(new Date()),
                               paymentAmount: Number(res),
                               paymentNote:'',
                               remainingBalance:Number(res) });
                              this.getPayments(this.payment.get('invoiceId')?.value);
      this.messageService.add({ severity: 'info', detail: this.sharedService.T('paymentDeleteConfirmMessage') });                              
    });
  }

  redirectToCustomerDetailComponent(selectedInvoice:any)
  {
    let url = 'sv/customer/details/' + selectedInvoice.customerId;
    this.router.navigate([url]);
  }
 
  generatePdf(selectedInvoice:any){
    
    this.sharedService
    .printPdf('invoice',selectedInvoice.invoiceId.toString(),'basic')
    .pipe(
      catchError((err) => {
        console.log(err);
        throw err;
      })
    )
    .subscribe((response: any) => {
      if(response){
        var newBlob = new Blob([response], { type: "application/pdf" });
        window.open(window.URL.createObjectURL(newBlob));
      }
    });
  }
  onSave(){

    if (this.payment.invalid) {
      this.payment.markAllAsTouched();
      return;
  }    
    this.addPaymentBtnDisabled = true;
    this.invoiceService
    .createInvoicePayment(this.payment.value)
    .pipe(
      catchError((err) => {
        this.logger.error(err);
        throw err;
      })
    )
    .subscribe((res) => {
      let minimunPaymentAmount = 0;
      this.addPaymentBtnDisabled = true;
      if(Number(res) > 0 )
      {
        minimunPaymentAmount = 1;
        this.addPaymentBtnDisabled = false;
      }
      this.payment.controls["paymentAmount"].setValidators([Validators.min(minimunPaymentAmount), Validators.max(Number(res))]);
      this.payment.patchValue({invoiceId:this.payment.get('invoiceId')?.value,
                               paymentDate:this.sharedService.getDateString(new Date()),
                               paymentAmount: Number(res),
                               paymentNote:'',
                               remainingBalance:Number(res) });
                              this.getPayments(this.payment.get('invoiceId')?.value);
    });
  } 
  
  onCancel(){
    this.isDialogVisible = false;
  }
  
  onCloseDialog()
  {
    this.getInvoices();
  }
}

