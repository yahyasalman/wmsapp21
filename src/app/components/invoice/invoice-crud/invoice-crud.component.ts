import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ICustomer, IEnums, IInvoice, IInvoiceDetailPrompt, IProduct, IProductTemplate } from 'app/app.model';
import { InvoiceService } from 'app/services/invoice.service';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { ProductService } from 'app/services/product.service';
import { CustomerInputComponent } from 'app/components/shared/customer-input/customer-input.component';
import { MenuItem, MessageService, SortEvent } from 'primeng/api';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { catchError } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';
import { AiService } from 'app/services/ai.service';
import { CustomerService } from 'app/services';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';


@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    DragDropModule,
    // CustomerInputComponent,
    GenericLoaderComponent,IconFieldModule,InputIconModule 
  ],
  templateUrl: './invoice-crud.component.html',
  styleUrl: './invoice-crud.component.css',
  providers: [MessageService]
})

export class InvoiceCrudComponent implements OnInit {

  invoice: FormGroup;
  details: any = new FormArray([])

  manufacturers: any[] = [];
  templates: MenuItem[] = [];
  products: IProduct[] = [];
  models: any[] = [];

  createInvoice: boolean = true;
  isNewObject: boolean = true;
  errorOnCustomer: boolean = false;
  isSpinnerLoading: boolean = false;

  // default 0 means incmoms
  priceMode: number = 0;

  defaultCustomerId: number | null = null;
  defaultCustomerName: string | null = null;
  customerType: string = '';
  unitOptions: IEnums[] = [];
 isLoading: boolean = false;
 selectedContext:IEnums[] | null = null;
 
 selectedCustomerName: any = null;
   customers: ICustomer[] = [];
  constructor(private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private productService: ProductService,
    private readonly invoiceService: InvoiceService,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private workshopService: WorkshopService,
    private messageService: MessageService,
    private aiService: AiService,
    private readonly customerService: CustomerService,
  ) {
    this.invoice = this.fb.group({
      invoiceId: '',
      customerId: [null, Validators.required],
      invoiceDate: '', //new Date().toISOString().split('T')[0],
      vehiclePlate: '',
      vehicleMileage: null,
      vehicleManufacturer: '',
      vehicleModel: '',
      vehicleYear: [null, [Validators.pattern(/^\d{4}$/)]],
      creditDays: 0,
      dueDate: '',
      yourRef: '',
      paymentType: this.sharedService.getDefaultEnum('paymentType').value,
      currency: 'kr',
      deliveryDate: '',
      deliveryTime: '',
      price: 0.00,
      vat: 0.00,
      adjustment: 0.00,
      priceIncVat: 0.00,
      isSent: false,
      isPaid: false
    });
  }
   ngOnInit() {

   this.unitOptions = [{ country: '',
  lang: '',
  key: '',
  value: '',
  index: 0,
  isdefault: false,
  text: '-',
  sverity: '' }, ...this.sharedService.getEnums('productUnit')];
    
    const param: any = this.route.snapshot.params;

    if (param.invoiceId && (Number(param.invoiceId) > 0 && param.duplicate == 'false'))
      this.createInvoice = false;

    this.logger.info(param.offerId, param.workOrderId, param.customerId, param.invoiceId, param.duplicate);

   this.isLoading= true
    this.invoiceService
      .getInvoice(param.offerId, param.workOrderId, param.customerId, param.invoiceId, param.duplicate)
      .pipe(catchError((err) => {
        this.isLoading = false;
        console.log(err); throw err;
      })).subscribe((response: any) => {
        this.logger.info('invoice-fetched', response);
        this.defaultCustomerId = response.data.customerId;
        this.defaultCustomerName = response.data.customerName;
         this.selectedCustomerName = response.data.customerName;
        this.priceMode = response.data.priceMode;
        this.isNewObject = response.isNewObject;
        this.loadInvoiceToEdit(response.data, 'g.editinvoice');
        this.updateDueDate();
        this.getTemplates();
        this.isLoading = false;
      });
  }
  trackByFn(index: number, detail: AbstractControl | null | undefined): number {
    if (detail && detail.get('rowIndex')) {
      return detail.get('rowIndex')?.value ?? index;
    }
    return index;
  }
  getFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }
  loadInvoiceToEdit(response: any, key: string) {
    if (response.details) {
      response.details.forEach((detail: any) => {
        detail.isProductValid = true;
        detail.isUnitPriceValid = true;
      });

      this.invoice.patchValue(response);
      response.details.forEach((element: any) => {
        element.vatPercentage = element.vatPercentage.toString();
        this.details.push(this.fb.group(element));
      });
    }
    else {
      this.invoice.patchValue(response);
      this.addDetailRow(false);
    }

  }

  updateDueDate() {
    let invoiceCreditDays = Number(this.invoice.get('creditDays')?.value) ?? 0;
    let newDate = new Date();
    if (this.invoice.get('invoiceDate')?.value !== '')
      newDate = new Date(this.invoice.get('invoiceDate')?.value);
    newDate.setDate(newDate.getDate() + invoiceCreditDays);
    this.invoice.patchValue({ dueDate: newDate.toISOString().split('T')[0] });
  }

  getTemplates() {
    this.isLoading=true;
    this.productService
      .getDetailTemplates()
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        if (res) {

          this.logger.info('Prinitng Templates');
          this.logger.info(res);
          res.forEach(selectOption => {
            this.templates.push({ label: selectOption.productTemplateName, command: () => { this.addTemplate(selectOption.productTemplateId); } });
             this.isLoading=false;
          });
        }
      });

  }

  // customer selection
  onChangeCustomer($event: any) {
    this.invoice.patchValue({ customerId: $event.customerId, customerName: $event.customerName, creditDays: $event.invoiceCreditDays });
    this.updateDueDate();
    this.errorOnCustomer = false;
  }

  onChangeCreditDays(e: any) {
    this.invoice.patchValue({ creditDays: Number(e.target.value) });
    this.updateDueDate();
  }

  onSelectInvoiceDate(selectedInvoiceDate: Date) {
    this.logger.info('New Value');
    this.logger.info(this.sharedService.getDateString(selectedInvoiceDate));
    this.invoice.patchValue({ invoiceDate: this.sharedService.getDateString(selectedInvoiceDate) });
    this.updateDueDate();
  }

  // vehicle plate selection
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  }

  filterManufacturers(event: any): void {
    this.manufacturers = this.sharedService.getVehicleManufacturers(event.query.toUpperCase());
  }

  filterModels(event: any): void {
    this.models = this.sharedService.getVehicleModels(this.invoice.get('vehicleManufacturer')?.value, event.query.toUpperCase());
  }

  // detail selection
  getProducts(event: AutoCompleteCompleteEvent) {
    this.isSpinnerLoading = true;
    let query = event.query;
    this.productService.getProductsByprefix(query).subscribe((response) => {
      this.products = response;
      this.isSpinnerLoading = false;
    })

  }

  onSelectProduct(detail: any, e: any) {
    const item = e.value;
    this.logger.info('Selected product:', item);
      if(e.value){
        const {wmsId,productId,category,productName,productDescription,quantity,unit,unitPrice,vatPercentage,price,vat,priceIncVat} = e.value;
        detail.patchValue({
          category:category,
          productId: productId,
          product: productName,
          description: productDescription,
          quantity: quantity,
          unit: unit,
          unitPrice: unitPrice,
          vatPercentage: vatPercentage
        })
        this.updateDetailRow(detail);
        this.isSpinnerLoading = false;
      }
  } 
  // invoice-detail  
  addDetailRow(isTextRow: boolean) {
    const detailRow = this.fb.group({
        invoiceId: this.invoice.get('invoiceId')?.value,
        rowIndex : this.details.controls.length,
        category:this.sharedService.getDefaultEnum('detailCategory').value, //'part', 
        productId: [null],
        product: '',
        isProductValid:true,
        description: '',
        quantity: 1,
        unit: '',//this.sharedService.getDefaultEnum('productUnit').value,//this.defaultProductUnit,
        unitPrice: null,
        isUnitPriceValid:true,
        vatPercentage: this.sharedService.getDefaultEnum('vatPercentage').value, //this.defaultVatPercentage,
        discountPercentage: null,
        price: 0.00,
        vat:0.00,
        priceIncVat: 0.00,
        textContent: undefined,
        isTextRow:isTextRow
      });
    this.details.push(detailRow);
  }

  updateDetailRow(detail: any) {
    if (Number(detail.get('unitPrice').value) > 0)
      detail.patchValue({ isUnitPriceValid: true });

    const quantity = Number(detail.get('quantity').value) < 0 ? 0 : Number(detail.get('quantity').value);
    const discountPercentage = Number(detail.get('discountPercentage').value) / 100;
    const vatPercentage = Number(detail.get('vatPercentage').value) / 100;

    this.logger.info('vatPercentage==' + vatPercentage);

    let unitPrice = 0.00;
    //if(this.priceMode == 1 || (this.priceMode == 2 && (this.customerType == 'company' || this.customerType == '' )))              
    if (this.priceMode == 1)
      unitPrice = Number(detail.get('unitPrice').value);

    //if(this.priceMode == 0 || (this.priceMode == 2 && (this.customerType == 'private' )))        
    if (this.priceMode == 0)
      unitPrice = Math.round((Number(detail.get('unitPrice').value) / (1 + vatPercentage)) * 100) / 100;

    unitPrice = unitPrice < 0 ? 0 : unitPrice;
    const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
    const totalDiscount = Math.round(totalPrice * discountPercentage * 100) / 100;
    const price = (Math.round((totalPrice - totalDiscount) * 100) / 100);
    const vat = (Math.round(Number(price) * vatPercentage * 100) / 100).toFixed(2);

    this.logger.info('vat==' + vat);

    const priceIncVat = (Math.round((Number(price) + Number(vat)) * 100) / 100).toFixed(2);

    //this.logger.info('quantity=' + quantity + '\nunitprice=' + unitPrice + '\ndiscount=' + discountPercentage + '\nvat=' + vatPercentage+'\ntotalprice=' + totalPrice + '\nprice=' + price + '\ntotaldiscount=' + totalDiscount +'\nvat'+ vat + '\npriceincVat' + priceIncVat);
    detail.patchValue({ price: price, vat: vat, priceIncVat: priceIncVat, vatPercentage: detail.get('vatPercentage').value.toString() });
    this.logger.info('detail patched with new values');
    this.logger.info(detail.value);

    this.updateInvoice();
  }

  removeDetailRow(rowIndex: number) {
    this.details.removeAt(rowIndex);
    this.details.controls.forEach((item: any, rowIndex: number) => {
      item.patchValue({ rowIndex: rowIndex });
    });
    this.updateInvoice();
  }

  updateInvoice(): void {

    var price = this.details.controls.reduce((sum: number, item: any) => {
      const price = Number(item?.get('price').value) || 0; // Ensure it's a number
      return sum + price;
    }, 0);
    price = (Math.round(price * 100) / 100).toFixed(2);
    var vat = this.details.controls.reduce((sum: number, item: any) => {
      const price = Number(item?.get('vat').value) || 0; // Ensure it's a number
      this.logger.info('price==' + price);
      return sum + price;
    }, 0);

    vat = (Math.round(vat * 100) / 100).toFixed(2);

    let priceIncVat = Math.round((Number(price) + Number(vat)) * 100) / 100;
    let decimalPart = Number(priceIncVat.toFixed(2).toString().split(".")[1]);
    let adjustment = '';
    if (decimalPart >= 50 && decimalPart <= 99) {
      adjustment = ((100 - decimalPart) / 100).toFixed(2);
    }
    else {
      adjustment = ((decimalPart / 100) * -1).toFixed(2);
    }
    priceIncVat = priceIncVat + Number(adjustment);
    // I have commented below code to avoid negative adjustment issue
    // let originalSign = priceIncVat < 0 ? -1 : 1;
    // priceIncVat = Math.abs(priceIncVat) + Number(adjustment);
    // priceIncVat = priceIncVat * originalSign;

    this.invoice.patchValue({ price: price, vat: vat, adjustment: adjustment, priceIncVat: priceIncVat });
  }

  onChangeVat(detail: any) {
    //this.logger.info(e.target.value);
    this.logger.info(detail.value.vatPercentage);

    detail.patchValue({ vatPercentage: detail.value.vatPercentage })
    this.updateDetailRow(detail);
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.details.controls, event.previousIndex, event.currentIndex);
      this.details.controls.forEach((item: any, index: number) => {
        item.patchValue({ rowIndex: index });
      });
      this.updateInvoice();
    }
  }

  addTemplate(templateId: number) {
    this.logger.info('inside template', templateId);
    this.isLoading= true;
    this.productService
      .getDetailTemplate(templateId)
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      ).subscribe((response: any) => {
        this.logger.info('salman-response', response);
        response.forEach((element: any) => {
          this.logger.info('element', element);
          var productRow: any = {};
          productRow.invoiceId = this.invoice.get('invoiceId')?.value;
          productRow.rowIndex = this.details.length;
          if(element.isTextRow){
          productRow.textContent = element.textContent;
          productRow.isTextRow = true;
          productRow.category = '';
          productRow.isProductValid = true;
          productRow.isUnitPriceValid = true;
          }
          else 
          {
          productRow.category = element.category;
          productRow.productId = element.productId;
          productRow.product = element.product;
          productRow.isProductValid = true;
          productRow.description = element.description;
          productRow.quantity = element.quantity;
          productRow.unit = element.unit;
          productRow.unitPrice = (this.priceMode == 0) ? element.priceIncVat : element.unitPrice;
          productRow.isUnitPriceValid = true;
          productRow.vatPercentage = element.vatPercentage;
          productRow.discountPercentage = 0;
          productRow.price = element.price;
          productRow.vat = element.vat;
          productRow.priceIncVat = element.priceIncVat;
          productRow.textContent = undefined;
          productRow.isTextRow = false;
          }
          this.details.push(this.fb.group(productRow));
          let lastIndex = this.details.length - 1;
          this.updateDetailRow(this.details.controls[lastIndex] as FormGroup);
           this.isLoading= false;
        });
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Data Saved' });
      });

  }

  onEnter(event: any): void {
    // const keyboardEvent = event as KeyboardEvent;
    event.preventDefault(); 
  }

onFormSubmit() {
    this.errorOnCustomer = false;
    const currentCustomerId = this.invoice.get('customerId')?.value;
  
  if (!currentCustomerId || currentCustomerId === 0) {
    this.errorOnCustomer = true;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: this.sharedService.T('Customer name is required'),
      life: 3000
    });
    return;
  }
    var invoice: IInvoice = this.invoice.value;
    invoice.details = [];

    for (const detail of this.details.controls) {
      const isProductValid = detail.get('product')?.value || detail.get('isTextRow') ? true : false;
      const isUnitPriceValid = detail.get('unitPrice')?.value || detail.get('isTextRow') ? true : false;
      detail.patchValue({ isProductValid: isProductValid, isUnitPriceValid: isUnitPriceValid });
      invoice.details.push(detail.value);
    }

    const invalidDetails = this.details.controls.filter(
      (detail: AbstractControl) => detail.get('isProductValid')?.value === false || detail.get('isUnitPriceValid')?.value === false
    );

    this.logger.info('invoide', invoice);

    if (invalidDetails.length > 0) {
      this.invoice.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.invoiceService
      .upsertInvoice(invoice)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        this.isLoading = false;
        
        if (res) {
          this.sharedService.clearState();
          this.sharedService.setState({ disableEdit: 'false', creditInvoice: 'false', customerId: invoice.customerId, customerEmail: invoice.customerEmail });
          this.router.navigate([`sv/invoice/details/${res.data?.invoiceId || invoice.invoiceId}`]); 
        }
      });
  }
    onCancelForm() {
    this.location.back();
  }

  redirectToInvoiceDetailComponent() {
    this.router.navigate(['/details', this.invoice.get('invoiceId')]);
  }
  GenerateInvoiceDescription(event:any,selectedCategory:IEnums,index:number) {
    this.selectedContext = [selectedCategory];
    let selectectContextValue = '';
    if (this.selectedContext) {
      selectectContextValue = this.selectedContext[0].value; 
    }
  const items: IInvoiceDetailPrompt[] = this.details.controls.map((item:any) => ({
  type: item.get('category')?.value,
  name: item.get('product')?.value,
  description: item.get('description')?.value,
  quantity: item.get('quantity')?.value,
  unit: item.get('unit')?.value,
  }));
  this.logger.info('index=' + index);
  const textareaControl = this.details.controls[index].get('textContent');
  this.aiService
      .getInvoiceDescription({context: selectectContextValue,items:items})
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        this.isLoading = false;
        if (res) {
          textareaControl.setValue(res.text);
          this.messageService.add({
            severity: 'success',
            detail: this.sharedService.T('aiTextAdded'),
          });
          
        }
          else {
          this.messageService.add({
            severity: 'error',
            detail: this.sharedService.T('errorMessage'),
          });
          }
          //this.selectedContext = null;
          
        });
  }

  // customer-input
  filterCustomer(event: any) {
    let query = event.query;
    this.customerService
      .getCustomerByPrefix(query)
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.customers = res;
        }
      });
  }

    onSelect(event: any) {
    this.invoice.patchValue({
      customerId: event.value.customerId,
      customerName: event.value.customerName,
    });
    this.selectedCustomerName = event.value.customerName;
  }
  onUnselectCustomer() {
    this.invoice.patchValue({
      customerId: null,
      customerName: null,
    });
    this.selectedCustomerName = null;
  }
}


