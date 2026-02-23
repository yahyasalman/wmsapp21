import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { IEnums, IInvoiceDetailPrompt, IOffer, IProduct } from 'app/app.model';
import { CustomerService } from 'app/services/customer.service';
import { SharedService } from 'app/services/shared.service';
import { OfferService } from 'app/services/offer.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { ProductService } from 'app/services/product.service';
import { CustomerInputComponent } from 'app/components/shared/customer-input/customer-input.component';
import { MenuItem, MessageService } from 'primeng/api';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { catchError } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AiService } from 'app/services/ai.service';


@Component({
  selector: 'app-create-offer',
  standalone : true,
imports: [
    ...SHARED_IMPORTS,GenericLoaderComponent,
    DragDropModule,
    CustomerInputComponent,IconFieldModule,InputIconModule
  ],  templateUrl: './offer-crud.component.html',
  styleUrl: './offer-crud.component.css',
  providers: [MessageService]
})

export class OfferCrudComponent implements OnInit {
  
  offer: FormGroup;
  details:any = new FormArray([])
  
  manufacturers:any[] =[];
  models:any[] =[]
  templates: MenuItem[] = [];
  products: IProduct[] = [];
  
  isNewObject:boolean = true;
  createOffer:boolean = true; 
  errorOnCustomer:boolean = false;
  isSpinnerLoading: boolean = false;
  isLoading:boolean = true
  priceMode:number = 0;
  defaultCustomerId:number | null = null;
  defaultCustomerName:string |null = null;
  customerType:string = '';
  unitOptions: IEnums[] = [];
selectedContext:IEnums[] | null = null;
  // added flag to mirror workOrder logic
  submitted: boolean = false;
  

  constructor(private logger: LogService,
              public readonly sharedService:SharedService,
              private router: Router,
              private readonly fb:FormBuilder,
              private customerService: CustomerService,
              private readonly offerService: OfferService,
              private readonly route: ActivatedRoute,
              private readonly location: Location,
              private messageService: MessageService,
            private workshopService: WorkshopService,
          private productService: ProductService,
        private aiService: AiService,) { 
    
    this.offer = this.fb.group({
      offerId:'',
      customerId:[null,Validators.required],
      offerDate:new Date().toISOString().split('T')[0],
      vehiclePlate:[null, Validators.required], // made required to match workOrder behavior
      vehicleMileage:0,
      vehicleManufacturer:'',
      vehicleModel:'',
      vehicleYear:[null,[Validators.pattern(/^\d{4}$/)]],
      validDays:10,
      validFrom:new Date().toISOString().split('T')[0],
      validTill:new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
      yourRef:'',
      paymentType:this.sharedService.getDefaultEnum('paymentType').value,
      price:0.00,
      vat:0.00,
      adjustment:0.00,
      priceIncVat:0.00,
      isSent:false,  
      isAccepted:false,
      isRejected:false, 
      offerType:this.sharedService.getDefaultEnum('offerType').value,
    });
  }
  ngOnInit()  {


   this.unitOptions = [{ country: '',
  lang: '',
  key: '',
  value: '',
  index: 0,
  isdefault: false,
  text: '-',
  sverity: '' }, ...this.sharedService.getEnums('productUnit')];

  const param: any = this.route.snapshot.params;
    if(param.offerId && (Number(param.offerId) > 0 && param.duplicate == 'false'))
      this.createOffer = false;

    this.logger.info(param.offerId,param.customerId,param.duplicate);    
     this.isLoading = true;
    this.offerService
    .getOffer(param.offerId,param.customerId,param.duplicate)
    .pipe(catchError((err) => { 
       this.isLoading = false;
            console.log(err); throw err;
            })).subscribe((response: any) => {
              this.defaultCustomerId = response.data.customerId;
              this.defaultCustomerName = response.data.customerName;
              this.priceMode = response.data.priceMode;
              this.isNewObject=response.isNewObject;
              this.loadOfferToEdit(response.data,'editinvoice');  
              this.getTemplates();
            });
            setTimeout(() => {
               this.isLoading = false;
            }, 500);
  }
  trackByFn(index: number, detail: AbstractControl | null | undefined): number {
    if (detail && detail.get('rowIndex')) {
        return detail.get('rowIndex')?.value ?? index;
    }
    return index; // Fallback to index if detail or rowIndex is undefined
}
  getFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

    loadOfferToEdit(response:any,key:string)
  {
    if(response.details)
    {
    response.details.forEach((detail:any) => {
      detail.isProductValid = true;
      detail.isUnitPriceValid = true;
    });
    this.offer.patchValue(response);
    response.details.forEach((element:any) => {
      element.vatPercentage = element.vatPercentage.toString();  
      this.details.push(this.fb.group(element));
      });
    }
    else 
    {
      this.offer.patchValue(response);
      this.addDetailRow(false);
    }

  }

  getTemplates() {
    this.isLoading = true;
    this.productService
      .getDetailTemplates()
      .pipe(
        catchError((err) => {
           this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
          if(res)
          {
             res.forEach(selectOption => {
             this.templates.push({ label:selectOption.productTemplateName,command:() => { this.addTemplate(selectOption.productTemplateId);}});
             });
          }
      
    });
     this.isLoading = false;
  }
  onDragStart(event: any, detail: any) {
    detail.isDragging = true;
  }

  onDragEnd(event: any, detail: any) {
    detail.isDragging = false;
  }

  onChangeCustomer($event:any) {
  this.logger.info($event);
  this.offer.patchValue({customerId:$event.customerId,customerName:$event.customerName});
  // clear customer error flag when a customer is selected
  this.errorOnCustomer = false;                                          
}
 
  updateValidTillDate()
  {
    let newDate = new Date(this.offer.get('validFrom')?.value);
    let days = Number(this.offer.get('validDays')?.value);
    newDate.setDate(newDate.getDate() + days);
    this.offer.patchValue({
      validTill:newDate.toISOString().split('T')[0]
    });
    
  }

 onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  }

  filterManufacturers(event: any): void {
    this.manufacturers = this.sharedService.getVehicleManufacturers(event.query.toUpperCase());
  }    
  filterModels(event: any): void {
    this.models = this.sharedService.getVehicleModels(this.offer.get('vehicleManufacturer')?.value,event.query.toUpperCase());
  }
// detail selection
  getProducts(event: AutoCompleteCompleteEvent){
     this.isLoading = true;
      this.isSpinnerLoading = true;
      let query = event.query;
        this.productService.getProductsByprefix(query).subscribe((response)=>{
          this.products = response;
          this.isSpinnerLoading = false;
        })    
       this.isLoading = false;
  }
  
  onSelectProduct(detail:any,e:any){
    const item = e.value;
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
  
  addDetailRow(isTextRow:boolean) {
    const detailRow = this.fb.group({
        offerId: this.offer.get('offerId')?.value,
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


  // Here we are getting complete detailrow to update
  updateDetailRow(detail:any) 
  {
    if (Number(detail.get('unitPrice').value) > 0)
      detail.patchValue({isUnitPriceValid:true});
    
    const quantity = Number(detail.get('quantity').value) < 0 ? 0 : Number(detail.get('quantity').value);
    const discountPercentage = Number(detail.get('discountPercentage').value)/100;
    const vatPercentage = Number(detail.get('vatPercentage').value)/100;
    
    this.logger.info('vatPercentage==' + vatPercentage);

    let unitPrice = 0.00;
    if(this.priceMode == 1) 
      unitPrice = Number(detail.get('unitPrice').value);

    if(this.priceMode == 0) 
      unitPrice = Math.round((Number(detail.get('unitPrice').value)/ (1 + vatPercentage))*100)/100;
    
    unitPrice = unitPrice < 0 ? 0: unitPrice;
    const totalPrice = Math.round(quantity * unitPrice * 100)/100;
    const totalDiscount =  Math.round(totalPrice * discountPercentage * 100)/100;   
    const price = (Math.round((totalPrice - totalDiscount) *100)/100);
    const vat = (Math.round(Number(price) * vatPercentage * 100)/100).toFixed(2);
    
    this.logger.info('vat==' + vat);

    const priceIncVat = (Math.round((Number(price) + Number(vat)) * 100)/100).toFixed(2);

    detail.patchValue({price:price,vat:vat,priceIncVat:priceIncVat,vatPercentage:detail.get('vatPercentage').value.toString()});
    this.logger.info('detail patched with new values');
    this.logger.info(detail.value);

    this.updateOffer();
  }
  
  removeDetailRow(rowIndex:number){
    this.details.removeAt(rowIndex);  
    this.details.controls.forEach((item:any, rowIndex:number) => {
      item.patchValue({rowIndex:rowIndex}); 
   });
    this.updateOffer();
  }
 
  updateOffer():void{

    var price = this.details.controls.reduce((sum: number, item: any) => {
      const price = Number(item?.get('price').value) || 0; // Ensure it's a number
      return sum + price;
    }, 0);
    price = (Math.round(price*100)/100).toFixed(2);
    var vat = this.details.controls.reduce((sum: number, item: any) => {
      const price = Number(item?.get('vat').value) || 0; // Ensure it's a number
      this.logger.info('price==' + price);
      return sum + price;
    }, 0);
    
    vat = (Math.round(vat*100)/100).toFixed(2);

    let priceIncVat = Math.round((Number(price) + Number(vat))*100)/100;
    let decimalPart = Number(priceIncVat.toFixed(2).toString().split(".")[1]);
    let adjustment = '';
    if(decimalPart >= 50 && decimalPart <= 99)
    {
      adjustment = ((100 - decimalPart)/100).toFixed(2);
    }
    else 
    {
      adjustment =  ((decimalPart/100) * -1).toFixed(2);
    }
    priceIncVat = priceIncVat + Number(adjustment);

    
    this.offer.patchValue({price:price,vat:vat,adjustment:adjustment,priceIncVat:priceIncVat});
  }
  
 

  onChangeVat(detail:any){
    this.logger.info(detail.value.vatPercentage);
    detail.patchValue({vatPercentage:detail.value.vatPercentage})
    this.updateDetailRow(detail);
  }

  onDrop(event: CdkDragDrop<any[]>){
   if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.details.controls, event.previousIndex, event.currentIndex);
        this.details.controls.forEach((item:any, index:number) => {
            item.patchValue({rowIndex:index}); 
         });
        this.updateOffer();
      }
  }

  addTemplate(templateId:number){
     this.isLoading = true;
    this.productService
    .getDetailTemplate(templateId)
    .pipe(
    catchError((err) => {
       this.isLoading = false;
        console.log(err);
        throw err;
        })
    ).subscribe((response: any) => {
        this.logger.info('salman-response', response);
        response.forEach((element: any) => {
          this.logger.info('element', element);
          var productRow: any = {};
          productRow.offerId = this.offer.get('offerId')?.value;
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
        let lastIndex = this.details.length -1;
        this.updateDetailRow(this.details.controls[lastIndex] as FormGroup);            
        
        });
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Data Saved' });
      });
    setTimeout(() => {
       this.isLoading = false;
    }, 500);
  }

  onEnter(event: any): void {
    const keyboardEvent = event as KeyboardEvent;
    event.preventDefault();  // Prevents form submission
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
  onFormSubmit() {
 this.isLoading = true;
    this.errorOnCustomer = false;  

    // form-level validation: mark touched + notify
    if (this.offer.invalid) {
      this.offer.markAllAsTouched();
      this.errorOnCustomer = true;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill required fields', life: 3000 });
       this.isLoading = false;
      return;
    }

    var offer:IOffer = this.offer.value;
    offer.details = [];

    for (const detail of this.details.controls) 
      {
        const isProductValid = detail.get('product')?.value || detail.get('isTextRow') ? true : false;
        const isUnitPriceValid = detail.get('unitPrice')?.value || detail.get('isTextRow') ?  true : false;
        detail.patchValue({isProductValid:isProductValid,isUnitPriceValid:isUnitPriceValid});
        offer.details.push(detail.value);
      }

    // details-level validation: show error + stop
    const invalidDetails = this.details.controls.filter(
      (detail: AbstractControl) => detail.get('isProductValid')?.value === false || detail.get('isUnitPriceValid')?.value === false
    );    
    
    if(invalidDetails.length > 0 ){
      this.offer.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please check product rows — missing product or unit price', life: 3500 });
       this.isLoading = false;
      return;
    }
 this.isLoading = true;
    this.offerService
        .upsertOffer(offer)
        .pipe(
          catchError((err) => {
             this.isLoading = true;
            console.log(err);
            throw err;
          })
        )
        .subscribe((res: any) => {
          if (res) {
          this.sharedService.clearState();
          this.sharedService.setState({disableEdit:'false',creditInvoice:'false',customerId: offer.customerId,customerEmail: offer.customerEmail});
          this.router.navigate([`sv/offer/details/${offer.offerId}`]);
          }
        });
        setTimeout(() => {
           this.isLoading = false;
        }, 500);
  }

  onCancelForm(){
    this.location.back();
  }
  
}    
