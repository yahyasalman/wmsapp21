import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import { ICustomerTag, ICustomerType, IWorkshop, ISelect, IPager,IInvoiceDetailPrompt, IWorkShopService, IProductTemplate, IProduct, IEnums } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, Observable, finalize, takeUntil, Subject } from 'rxjs';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ProductService } from 'app/services/product.service';
import { SaleService } from 'app/services/sale.service ';
import { SplitterModule } from 'primeng/splitter';
import { AiService } from 'app/services/ai.service';
import { TabsModule } from 'primeng/tabs';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { PopoverModule } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';
import { RadioButtonModule } from 'primeng/radiobutton';
@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TabsModule,
    SelectButtonModule,
    ImageModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    AutoCompleteModule,
    ToastModule,
    MessageModule,
    DragDropModule,
    SplitterModule,
    ConfirmDialogModule,
    TableModule,
    InputNumberModule,
     TooltipModule,
     CheckboxModule,
     PopoverModule,
     DatePickerModule,
     RadioButtonModule 
  ],
  templateUrl: './setting-crud.component.html',
  styleUrl: './setting-crud.component.css',
  providers: [ConfirmationService, MessageService],
})
export class SettingCrudComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  selectedTemplateIndex: number  = 0;
  langCode: string = 'en';
  
  palettes = [
  { label: 'Professional Blue', value: 'blue', color: '#3b82f6' },     // Default
  { label: 'Modern Indigo',     value: 'indigo', color: '#4f46e5' },
  { label: 'Industrial Teal',   value: 'teal', color: '#0d9488' },
  { label: 'Minimal Slate',     value: 'slate', color: '#64748b' },
  { label: 'Fresh Emerald',     value: 'emerald', color: '#10b981' },
  { label: 'Deep Red',          value: 'red', color: '#b91c1c' }       // Muted red (not alert red)
];


 selectedPriceMode:any = '';
 selectedInvoiceTemplate:any = '';
 selectedSaleYear:string = new Date().getFullYear().toString();
 isSpinnerLoading: boolean = false;
 workshop: FormGroup;
 workshopServiceForm: FormGroup;
  saleTarget: FormGroup;
  salesList: any[] = [];
  isEditMode: boolean = false;
  
  latestServiceId: string = '';
  editingService: IWorkShopService | null = null;
  isLoading: boolean = false;

  customerTags: ICustomerTag[] = [];
  products: IProduct[] = [];
  ProductTemplates: IProductTemplate[] = [];
  fTaxOptions = [
    { label: 'Ja', value: true },
    { label: 'Nej', value: false }
  ];
  //priceModeOptions: IEnums[] = [];
  details: any = new FormArray([])
  draggingRowIndex: number | null = null;
  unitOptions: IEnums[] = [];
  newCustomerTag: ICustomerTag = {
    wmsId: '',
    customerTagId: 0,
    customerTagName: '',
    customerCount: 0,
    isDefault: false
  };

  newProductTemplate: IProductTemplate = {
    wmsId: '',
    productTemplateId: 0,
    productTemplateName: '',
    details: [],

  };

  customerTypes: ICustomerType[] = [];
  newCustomerType: ICustomerType = {
    wmsId: '',
    customerTypeId: 0,
    customerTypeName: '',
    customerCount: 0,
    isDefault: false
  };
  selectedContext:IEnums[] | null = null;
  isTagEditing: boolean = false;
  isTemplateEditing: boolean = false;
  editingTagIndex: number | null = null;
  editingTemplateIndex: number | null = null;
  isTypeEditing: boolean = false;
  editingTypeIndex: number | null = null;
  imageUrl: string = '';
  fileKey: string = '';
  invoiceTemplates:any[] = [{value: 'basic', name: 'Basic Template' }, {value: 'modern', name: 'Modern Template'}];
  constructor(
    private logger: LogService,
    public readonly sharedService: SharedService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly workshopService: WorkshopService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private productService: ProductService,
    private saleService: SaleService,
    private aiService: AiService,
  ) {
    this.workshop = this.fb.group({
      workshopName: [],
      registrationId: [],
      vatId: [],
      workshopStreet: [],
      workshopPostNo: [],
      workshopCity: [],
      workshopCountry: [],
      telephone: [],
      email: ['', [Validators.email]],
      bankgiro: '',
      swish: '',
      bic: '',
      iban: '',
      
      isFskat: [false],
      defaultLang: '',
      defaultTheme: ''
    });

    this.workshopServiceForm = this.fb.group({
      serviceName: ['', Validators.required],
      serviceHours: [1, [Validators.required, Validators.min(0)]],
    });

    this.saleTarget = this.fb.group({
      wmsId: this.sharedService.wmsId,
      datePeriod: [null, Validators.required],
      turnover: [0, [Validators.required, Validators.min(1)]]
    });

  }

  ngOnInit(){
   
    // adding default option to unit dropdown
    this.unitOptions = [{country: '',lang: '',key: '',value: '',index: 0,isdefault: false,text: '-',sverity: ''}, ...this.sharedService.getEnums('productUnit')];
    this.workshopService
      .getWorkshop()
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (!response) return;
          this.logger.info(response);
          if (typeof response.isFskat === 'string') {
            response.isFskat = response.isFskat === 'true';
          }
          this.workshop.patchValue(response);
          this.selectedPriceMode = this.sharedService.getEnumByValue('priceMode', response.priceMode);
          this.selectedInvoiceTemplate = this.invoiceTemplates.find(template => template.value === response.defaultInvoiceTemplate);
          this.logger.info('priceMode and Template:', this.selectedPriceMode, this.selectedInvoiceTemplate);
        },
        error: (err) => {
          this.logger.error('Error loading workshop:', err);
        }
      });
      

    this.loadCustomerTags();
    this.loadCustomerTypes();
    this.loadLogo();
    this.loadProductTemplates();
    this.loadSaleTargets(this.selectedSaleYear);
  }

  // Company Tab 
   saveWorkshopSettings() 
  {
    if (this.workshop.invalid) {
      const emailControl = this.workshop.get('email');
      if (emailControl?.hasError('email')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Invalid Email',
          detail: 'Please enter a valid email format (e.g., name@example.com).',
          life: 4000,
        });
      }
      this.workshop.markAllAsTouched();
      return;
    }

    const editedWorkshop: IWorkshop = this.workshop.value;
    editedWorkshop.priceMode = Number(this.selectedPriceMode.value); 
    editedWorkshop.defaultInvoiceTemplate = this.selectedInvoiceTemplate.value;

    editedWorkshop.isFskat = this.workshop.get('isFskat')?.value === true;
    this.workshopService
    .updateWorkshop(editedWorkshop)
    .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
           this.messageService.add({
        severity: 'success',
        summary: this.sharedService.T('success'),
        icon: 'pi pi-check-circle',
        detail: 'Workshop updated successfully!',
      });
      this.router.navigate(['sv/setting']);
          }
        },
        error: (err) => {
          this.logger.error('Error updating workshop:', err);
        }
      });
    
  }

  loadLogo() {
    this.isLoading = true;
    this.workshopService.listFiles()
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (files) => {
          if (files?.length) {
            this.fileKey = files[0].key;
            this.showFile(this.fileKey);
          }
        },
        error: (err) => {
          this.logger.error('Error loading logo:', err);
        }
      });
  }
  showFile(key: string) {
    this.workshopService.downloadFile(key)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.imageUrl = e.target.result;
          };
          reader.readAsDataURL(blob);
        },
        error: (err) => {
          this.logger.error('Error downloading file:', err);
        }
      });
  }
  downloadFile(key: string) {
    this.logger.log('Downloading file with key:', key);
    this.sharedService.downloadFile(key);
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => this.imageUrl = e.target.result;
    reader.readAsDataURL(file);
    this.isLoading = true;
    this.workshopService.uploadFile(file)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: this.sharedService.T('success'),
            icon: 'pi pi-check-circle',
            life: 4000
          });
          if (response?.key) this.fileKey = response.key;
        },
        error: (err) => {
          this.logger.error('File upload failed:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Error',
            detail: 'Failed to upload image. Please try again.',
            life: 5000
          });
        }
      });
  }

  // Customer Tab
  loadCustomerTags() {
    this.workshopService
      .getCustomerTags()
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response)
            this.customerTags = response;
        },
        error: (err) => {
          this.logger.error('Error loading customer tags:', err);
        }
      });
  }
  saveCustomerTag(): void {

    const alreadyDefault = this.customerTags.some((t, i) =>
      t.isDefault && (!this.isTagEditing || i !== this.editingTagIndex)
    );

    if (this.newCustomerTag.isDefault && alreadyDefault) {
      this.messageService.add({
        severity: 'error',
        summary: 'Default Tag Error',
        detail: 'A default tag already exists. Only one default tag allowed.',
        life: 3000
      });
      return;
    }

    if (this.newCustomerTag.customerTagName.trim()) {

      let isUpdate = false;

      if (this.isTagEditing && this.editingTagIndex !== null) {
        isUpdate = true;
        this.customerTags[this.editingTagIndex] = { ...this.newCustomerTag };
        this.isTagEditing = false;
        this.editingTagIndex = null;
      } else {
        this.newCustomerTag.customerTagId = 0;
      }

      this.isLoading = true;

      this.workshopService
        .upsertCustomerTag(this.newCustomerTag)
        .pipe(
          finalize(() => { this.isLoading = false; }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response: any) => {
            if (response) {
              this.loadCustomerTags();
              this.messageService.add({
                severity: 'success',
                summary: this.sharedService.T('success'),
                icon: 'pi pi-check-circle',
                life: 2000
              });
            }
            this.resetCustomerTag();
          },
          error: (err) => {
            this.logger.error('Error saving tag:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Save Failed',
              detail: 'Unable to save tag. Please try again.',
              life: 3000
            });
          }
        });
    }
  }

  editCustomerTag(index: number): void {
    const tag = this.customerTags[index];
    this.newCustomerTag = { ...tag };
    this.isTagEditing = true;
    this.editingTagIndex = index;
  }

  resetCustomerTag(): void {
    this.newCustomerTag = {
      wmsId: '',
      customerTagId: 0,
      customerTagName: '',
      customerCount: 0,
      isDefault: false
    };
    this.isTagEditing = false;
    this.editingTagIndex = null;
  }
  removeCustomerTag(index: number): void {
    const tag = this.customerTags[index];
    if (tag.customerCount > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Cannot Delete Tag',
        detail: `This tag is used by ${tag.customerCount} customers.`,
        life: 3000
      });
      return;
    }
    this.isLoading = true;
    this.workshopService
      .deleteCustomerTag(tag.customerTagId)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.customerTags.splice(index, 1);
          if (this.isTagEditing && this.editingTagIndex === index) {
            this.resetCustomerTag();
          }
          this.messageService.add({
            severity: 'success',
            summary: this.sharedService.T('success'),
            icon: 'pi pi-check-circle',
            life: 2000
          });
        },
        error: (err) => {
          this.logger.error('Error deleting tag:', err);
        }
      });
  }

   loadCustomerTypes() {
    this.workshopService
      .getCustomerTypes()
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response)
            this.customerTypes = response;
        },
        error: (err) => {
          this.logger.error('Error loading customer types:', err);
        }
      });
  }
  saveCustomerType(): void {

    const alreadyDefault = this.customerTypes.some((t, i) =>
      t.isDefault && (!this.isTagEditing || i !== this.editingTypeIndex)
    );

    if (this.newCustomerType.isDefault && alreadyDefault) {
      this.messageService.add({
        severity: 'error',
        summary: 'Default Type Error',
        detail: 'A default Type already exists. Only one default Type allowed.',
        life: 3000
      });
      return;
    }

    if (this.newCustomerType.customerTypeName.trim()) {

      let isUpdate = false;   // ⭐ FIX #1 — track update before modifying flags

      if (this.isTypeEditing && this.editingTypeIndex !== null) {
        isUpdate = true;      // ⭐ FIX #2 — now message will be correct
        this.customerTypes[this.editingTypeIndex] = { ...this.newCustomerType };
        this.isTypeEditing = false;
        this.editingTagIndex = null;
      } else {
        this.newCustomerType.customerTypeId = 0;
      }

      this.isLoading = true;

      this.workshopService
        .upsertCustomerType(this.newCustomerType)
        .pipe(
          finalize(() => { this.isLoading = false; }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response: any) => {
            if (response) {
              this.loadCustomerTypes();
              this.messageService.add({
                severity: 'success',
                summary: this.sharedService.T('success'),
                icon: 'pi pi-check-circle',
                life: 2000
              });
            }
            this.resetCustomerType();
          },
          error: (err) => {
            this.logger.error('Error saving type:', err);
          }
        });
    }
  }

  editCustomerType(index: number): void {
    const customerType = this.customerTypes[index];
    this.newCustomerType = { ...customerType };
    this.isTypeEditing = true;
    this.editingTypeIndex = index;
  }

  resetCustomerType(): void {
    this.newCustomerType = {
      wmsId: '',
      customerTypeId: 0,
      customerTypeName: '',
      customerCount: 0,
      isDefault: false
    };
    this.isTypeEditing = false;
    this.editingTypeIndex = null;
  }
  removeCustomerType(index: number): void {
    const type = this.customerTypes[index];
    if (type.customerCount > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Cannot Delete Type',
        detail: `This type is used by ${type.customerCount} customers.`,
        life: 3000
      });
      return;
    }
    this.isLoading = true;

    this.workshopService.deleteCustomerType(type.customerTypeId)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.customerTypes.splice(index, 1);
          if (this.isTypeEditing && this.editingTypeIndex === index) {
            this.resetCustomerType();
          }
          this.messageService.add({
            severity: 'success',
            summary: this.sharedService.T('success'),
            icon: 'pi pi-check-circle',
            life: 2000
          });
        },
        error: (err) => {
          this.logger.error('Error deleting type:', err);
        }
      });
  }
 
  // workorder Tab
  get isCreateMode(): boolean {
    return !this.editingService;
  }

  // Invoice Template


  loadProductTemplates() {
    this.workshopService
      .getProductTemplates()
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.ProductTemplates = response;
            this.logger.info('Product Templates Loaded', this.ProductTemplates);
            this.selectedTemplateIndex = 0;
            this.showProductTemplate(0);
          }
        },
        error: (err) => {
          this.logger.error('Error loading product templates:', err);
        }
      });
  }
  

  addProductTemplate(): void {
        this.newProductTemplate = {
          wmsId: this.sharedService.wmsId,
          productTemplateId:  0,
          productTemplateName: '',
          details: []
        };
  }

  saveProductTemplate(): void {
     this.logger.info('Saving Product Template:', this.newProductTemplate);
     this.workshopService
      .upsertProductTemplates(this.newProductTemplate)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.logger.info('Save Product Template Response:', response);
          if (response) {
            this.loadProductTemplates();
            this.messageService.add({
              severity: 'success',
              summary: this.sharedService.T('success'),
              icon: 'pi pi-check-circle',
              life: 2000
            });
          }
        },
        error: (err) => {
          this.logger.error('Error saving template:', err);
        }
      });
  }

  saveProductTemplateDetails(): void {
    // 1. Validation for Name
    const selectedTemplate = this.ProductTemplates[this.selectedTemplateIndex];
    const detailsPayload = this.details.controls.map((control: AbstractControl, index: number) => {
      const row = control.value;

      if (row.isTextRow) {
        return {
          rowIndex: index,
          isTextRow: true,
          textContent: row.textContent,
          quantity: 0,
          unitPrice: 0,
          price: 0,
          vat: 0,
          priceIncVat: 0
        };
      } else {
        const pName = (row.product && row.product.productName) ? row.product.productName : row.product;
        return {
          rowIndex: index,
          isTextRow: false,
          product: pName,
          category: row.category,
          // productName: (typeof row.product === 'object' && row.product !== null) ? row.product.productName : row.product,
          description: row.description,
          productId: row.productId || 0,
          quantity: row.quantity,
          unit: row.unit,
          unitPrice: row.unitPrice,
          vatPercentage: row.vatPercentage,
          discountPercentage: row.discountPercentage,
          totalPrice: row.price,        // Ex VAT
          vatAmount: row.vat,           // VAT Amount
          totalPriceIncVat: row.priceIncVat // Inc VAT
        };
      }
    });
    selectedTemplate.details = detailsPayload;
    this.workshopService
      .upsertProductTemplates(selectedTemplate)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.loadProductTemplates();
            this.messageService.add({
              severity: 'success',
              summary: this.sharedService.T('success'),
              icon: 'pi pi-check-circle',
              life: 2000
            });
          }
        },
        error: (err) => {
          this.logger.error('Error updating template:', err);
        }
      });
  }
  
  deleteProductTemplate(templateId: number,templateName:string): void {
   this.confirmationService.confirm({
    message: `Are you sure you want to delete "${templateName}"?`,
    header: 'Confirm Deletion',
    accept: () => {
      this.isLoading = true;
      this.workshopService.deleteProductTemplate(templateId)
        .pipe(
          finalize(() => { this.isLoading = false; }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: this.sharedService.T('success'), icon: 'pi pi-check-circle' });
            this.loadProductTemplates();
          },
          error: (err) => {
            this.logger.error('Error deleting template:', err);
          }
        });
    }
  });
  }
 
  showProductTemplate(index: number): void {
    this.selectedTemplateIndex = index;
    const productTemplateId = this.ProductTemplates[this.selectedTemplateIndex].productTemplateId;
    this.productService.getProductTemplateDetail(productTemplateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.details.clear();

          if (response && response.length > 0) {
            response.sort((a: any, b: any) => a.rowIndex - b.rowIndex);

            response.forEach((item: any, idx: number) => {
              let productObj = null;
              if (item.product) {
                productObj = {
                  productName: item.product,
                  productId: item.productId || 0
                };
              }

              const detailRow = this.fb.group({
                rowIndex: [idx],
                isTextRow: [item.isTextRow],
                textContent: [item.textContent],
                category: [item.category],

                product: [productObj],
                productId: [item.productId],

                description: [item.description],
                quantity: [item.quantity],
                unit: [item.unit],
                unitPrice: [item.unitPrice],
                isUnitPriceValid: [true],

                vatPercentage: [item.vatPercentage ? item.vatPercentage.toString() : '25'],
                discountPercentage: [item.discountPercentage],

                price: [item.price || 0],
                vat: [item.vat || 0],
                priceIncVat: [item.priceIncVat || 0]
              });

              this.details.push(detailRow);
            });
          }
        },
        error: (err) => {
          this.logger.error('Error loading template details:', err);
        }
      });
  }
  
  // Invoice Detail Template

  trackByFn(index: number, detail: AbstractControl | null | undefined): number {
    if (detail && detail.get('rowIndex')) {
      return detail.get('rowIndex')?.value ?? index;
    }
    return index;
  }
  addDetailRow(isTextRow: boolean) {
    const detailRow = this.fb.group({
      rowIndex: this.details.controls.length,
      category: this.sharedService.getDefaultEnum('detailCategory').value,
      product: '',
      isProductValid: true,
      description: '',
      quantity: 1,
      unit: '',
      unitPrice: null,
      isUnitPriceValid: true,
      vatPercentage: this.sharedService.getDefaultEnum('vatPercentage').value,
      discountPercentage: null,
      price: 0.00,
      vat: 0.00,
      priceIncVat: 0.00,
      textContent: undefined,
      isTextRow: isTextRow
    });
    this.details.push(detailRow);
  }

  onDragStart(event: any, detail: any) {
    detail.isDragging = true;
  }

  onDragEnd(event: any, detail: any) {
    detail.isDragging = false;
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.details.controls, event.previousIndex, event.currentIndex);
      this.details.controls.forEach((item: any, index: number) => {
        item.patchValue({ rowIndex: index });
      });
    }
  }

  removeDetailRow(rowIndex: number) {
    this.details.removeAt(rowIndex);
    this.details.controls.forEach((item: any, rowIndex: number) => {
      item.patchValue({ rowIndex: rowIndex });
    });
  }

    getProducts(detail:any, event: AutoCompleteCompleteEvent) {
    this.isSpinnerLoading = true;
    let category = detail.get('category').value;
    this.logger.info(category);
    let query = event.query;
    this.productService.getProductsByprefix(query)
      .pipe(
        finalize(() => { this.isSpinnerLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.products = response
            .filter((product: any) => product.category === category)
            .sort((a: any, b: any) => a.productName.localeCompare(b.productName));
          this.logger.info(this.products);
        },
        error: (err) => {
          this.logger.error('Error loading products', err);
          this.isSpinnerLoading = false;
        }
      });
  }


  onSelectProduct(detail: any, e: any) {
    const item = e.value;
    this.logger.info('Selected product:', item);
    if (e.value) {
      const { wmsId, productId, category, productName, productDescription, quantity, unit, unitPrice, vatPercentage, price, vat, priceIncVat } = e.value;
      detail.patchValue({
        category: category,
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
  onBlurProduct(event: any, detail: AbstractControl): void {
  const typedValue = event.target.value; // Get the typed value from the input
  detail.get('product')?.setValue(typedValue); // Update the form control with the typed value
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
    if (this.selectedPriceMode == 1)
      unitPrice = Number(detail.get('unitPrice').value);

    //if(this.priceMode == 0 || (this.priceMode == 2 && (this.customerType == 'private' )))        
    if (this.selectedPriceMode   == 0)
      unitPrice = Math.round((Number(detail.get('unitPrice').value) / (1 + vatPercentage)) * 100) / 100;

    unitPrice = unitPrice < 0 ? 0 : unitPrice;
    const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
    const totalDiscount = Math.round(totalPrice * discountPercentage * 100) / 100;
    const price = (Math.round((totalPrice - totalDiscount) * 100) / 100);
    const vat = (Math.round(Number(price) * vatPercentage * 100) / 100).toFixed(2);

    this.logger.info('vat==' + vat);

    const priceIncVat = (Math.round((Number(price) + Number(vat)) * 100) / 100).toFixed(2);

    detail.patchValue({ price: price, vat: vat, priceIncVat: priceIncVat, vatPercentage: detail.get('vatPercentage').value.toString() });
    this.logger.info('detail patched with new values');
    this.logger.info(detail.value);

  }

  onChangeVat(detail: any) {
    this.logger.info(detail.value.vatPercentage);

    detail.patchValue({ vatPercentage: detail.value.vatPercentage })
    this.updateDetailRow(detail);
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
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            textareaControl.setValue(res.text);
            this.messageService.add({
              severity: 'success',
              summary: this.sharedService.T('success'),
              icon: 'pi pi-check-circle'
            });
          } else {
            this.messageService.add({
              severity: 'error',
              detail: this.sharedService.T('errorMessage'),
            });
          }
        },
        error: (err) => {
          this.logger.error('Error generating description:', err);
        }
      });
  }

  getFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  // Sale Target Tab
  loadSaleTargets(saleYear:string) {
  this.isLoading = true;
  this.saleService.getSaleTarget(saleYear)
    .pipe(
      finalize(() => { this.isLoading = false; }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (res: any) => {
        this.salesList = res.objectList || [];
      },
      error: (err) => {
        this.logger.error('Sales load fail:', err);
      }
    });
}
onSaleTargetYearChange(event: any){
  this.logger.info(event.value);
  this.selectedSaleYear = event.value;
  this.loadSaleTargets(this.selectedSaleYear);

}

saveSaleTarget() {
  if (this.saleTarget.invalid) return;
  this.isLoading = true;
  const selectedDate = this.saleTarget.value.datePeriod as Date;
  const payload = {
    wmsId: this.sharedService.wmsId,
    saleYear: selectedDate.getFullYear(),
    saleMonth: selectedDate.getMonth() + 1,
    turnover: this.saleTarget.value.turnover
  };

  this.saleService.upsertSale(payload)
    .pipe(
      finalize(() => { this.isLoading = false; }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: () => {
        this.loadSaleTargets(this.selectedSaleYear);
        this.saleTarget.reset({ turnover: 0 });
      },
      error: (err) => {
        this.logger.error('Error saving sale target:', err);
      }
    });
}
deleteSaleTarget(sale: any) {
  this.confirmationService.confirm({
    message: 'Are you sure you want to delete this sales target?',
    header: 'Confirm Deletion',
    accept: () => {
      this.isLoading = true;
      this.saleService.deleteSale(sale.wmsId, sale.saleYear, sale.saleMonth)
        .pipe(
          finalize(() => { this.isLoading = false; }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: this.sharedService.T('success'), icon: 'pi pi-check-circle' });
            this.loadSaleTargets(this.selectedSaleYear);
          },
          error: (err) => {
            this.logger.error('Error deleting sale target:', err);
          }
        });
    }
  });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

}
