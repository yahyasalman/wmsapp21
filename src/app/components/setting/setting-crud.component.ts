import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import { ICustomerTag, ICustomerType, IWorkshop, ISelect, IPager,IInvoiceDetailPrompt, IWorkShopService, IProductTemplate, IProduct, IEnums } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, Observable } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ProductService } from 'app/services/product.service';
import { SaleService } from 'app/services/sale.service ';
import { SplitterModule } from 'primeng/splitter';
import { AiService } from 'app/services/ai.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,SplitterModule,DragDropModule
  ],
  templateUrl: './setting-crud.component.html',
  styleUrl: './setting-crud.component.css',
  providers: [ConfirmationService, MessageService],
})
export class SettingCrudComponent implements OnInit {
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
 
 workshop: FormGroup;
 workshopServiceForm: FormGroup;
  saleTarget: FormGroup;
  salesList: any[] = [];
    isEditMode: boolean = false;
  services: IWorkShopService[] = [];
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
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (!response) return;
        this.logger.info(response);
        if (typeof response.isFskat === 'string') {
          response.isFskat = response.isFskat === 'true';
        }
        this.workshop.patchValue(response);
        this.selectedPriceMode = this.sharedService.getEnumByValue('priceMode', response.priceMode);
        this.selectedInvoiceTemplate = this.invoiceTemplates.find(template => template.value === response.defaultInvoiceTemplate);
        this.logger.info('priceMode and Template:', this.selectedPriceMode, this.selectedInvoiceTemplate);
      });
      

    this.loadCustomerTags();
    this.loadCustomerTypes();
    this.loadWorkshopServices(); // This will load workshop services
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
        catchError((err) => {
          this.isLoading = true;
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
         this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Workshop updated successfully!',
      });
      this.router.navigate(['sv/setting']);
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
    
  }

  loadLogo() {
    this.isLoading = true;
    this.workshopService.listFiles()
      .subscribe({
        next: (files) => {
          if (files?.length) {
            this.fileKey = files[0].key;
            this.showFile(this.fileKey);
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }
  showFile(key: string) {
    this.workshopService.downloadFile(key).subscribe(blob => {

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(blob);
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
        catchError(err => {
          this.isLoading = false;
          console.error('File upload failed:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Error',
            detail: 'Failed to upload image. Please try again.',
            life: 5000
          });
          throw err;
        })
      )
      .subscribe((response: any) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Image uploaded successfully!',
          life: 4000
        });

        if (response?.key) this.fileKey = response.key;
      });
  }

  // Customer Tab
  loadCustomerTags() {
    this.workshopService
      .getCustomerTags()
      .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response)
          this.customerTags = response;
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
          catchError(err => {
            this.isLoading = false;
            console.error(err);

            this.messageService.add({
              severity: 'error',
              summary: 'Save Failed',
              detail: 'Unable to save tag. Please try again.',
              life: 3000
            });

            throw err;
          })
        )
        .subscribe((response: any) => {
          this.isLoading = false;

          if (response) {
            this.loadCustomerTags();

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: isUpdate ? 'Tag updated successfully!' : 'Tag added successfully!',
              life: 2000
            });
          }

          this.resetCustomerTag();
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
        catchError(err => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'Unable to delete tag. Please try again.',
            life: 3000
          });
          throw err;
        })
      )
      .subscribe({
        next: () => {
          this.customerTags.splice(index, 1);
          if (this.isTagEditing && this.editingTagIndex === index) {
            this.resetCustomerTag();
          }

          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Tag Deleted',
            detail: 'Customer Tag deleted successfully.',
            life: 2000
          });
        }
      });
  }

   loadCustomerTypes() {
    this.workshopService
      .getCustomerTypes()
      .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response)
          this.customerTypes = response;
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
          catchError(err => {
            this.isLoading = false;
            console.error(err);

            this.messageService.add({
              severity: 'error',
              summary: 'Save Failed',
              detail: 'Unable to save Type. Please try again.',
              life: 3000
            });

            throw err;
          })
        )
        .subscribe((response: any) => {
          this.isLoading = false;

          if (response) {
            this.loadCustomerTypes();

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: isUpdate ? 'Type updated successfully!' : 'Type added successfully!',
              life: 2000
            });
          }

          this.resetCustomerType();
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
        catchError(err => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'Unable to delete type. Please try again.',
            life: 3000
          });
          throw err;
        })
      )
      .subscribe({
        next: () => {
          this.customerTypes.splice(index, 1);
          if (this.isTypeEditing && this.editingTypeIndex === index) {
            this.resetCustomerType();
          }

          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Type Deleted',
            detail: 'Customer Type deleted successfully.',
            life: 2000
          });
        }
      });
  }
 
  // workorder Tab
  get isCreateMode(): boolean {
    return !this.editingService;
  }

  loadWorkshopServices(search:string = '') {
    this.workshopService
      .getServices(search)
      .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response){
          this.services = response || [];
          this.logger.info('Services Loaded', this.services);

          }
      });
  }

  saveWorkshopService(): void {
    this.workshopServiceForm.markAllAsTouched();

    if (this.workshopServiceForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields',
        life: 6000
      });
      return;
    }

    const serviceData: IWorkShopService = {
      wmsId: this.editingService?.wmsId || '', // optional but good practice
      serviceName: this.workshopServiceForm.get('serviceName')?.value,
      serviceHours: this.workshopServiceForm.get('serviceHours')?.value,
      // 👇 create k liye 0, edit k liye existing value
      workshopServiceId: this.editingService?.workshopServiceId || 0
    };

    this.isLoading = true;
    if (!this.editingService) {
      this.workshopService.isWorkshopServiceExists(serviceData.serviceName)
        .subscribe({
          next: (exists: boolean) => {
            if (exists) {
              this.isLoading = false;

              this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Service',
                detail: `Service "${serviceData.serviceName}" already exists!`,
                life: 6000
              });
            } else {
              this.workshopService.upsertWorkshopService(serviceData)
                  .pipe(catchError((err) => {
                      console.log(err); throw err;
                    })).subscribe((response: any) => {
                      if (response){
                          const isUpdate = !!serviceData.workshopServiceId && serviceData.workshopServiceId !== 0;
                          this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: `Service "${serviceData.serviceName}" has been successfully ${isUpdate ? 'updated' : 'added'}!`,
                          });
                          this.loadWorkshopServices();
                          this.resetWorkshopService();
                          this.latestServiceId = response?.wmsId || '';
                        }
                  });
            }
          },
          error: () => {
            this.isLoading = false;

            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Unable to verify service existence. Please try again.',
              life: 6000
            });
          }
        });
    } else {
      this.workshopService.upsertWorkshopService(serviceData)
    .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response){
            const isUpdate = !!serviceData.workshopServiceId && serviceData.workshopServiceId !== 0;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Service "${serviceData.serviceName}" has been successfully ${isUpdate ? 'updated' : 'added'}!`,
            });
            this.loadWorkshopServices();
            this.resetWorkshopService();
            this.latestServiceId = response?.wmsId || '';
          }
    });
    }
  }

  editWorkshopService(service: IWorkShopService): void {
    this.editingService = { ...service }; // Create a copy to track original values
    this.workshopServiceForm.patchValue({
      serviceName: service.serviceName,
      serviceHours: service.serviceHours
    });

    // Scroll to form for better UX
    setTimeout(() => {
      const formElement = document.querySelector('.service-form-section');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  deleteWorkshopService(service: IWorkShopService): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${service.serviceName}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isLoading = true; // show loader

        this.workshopService.deleteWorkshopService(service.wmsId!, service.workshopServiceId!)
          .pipe(
            catchError((err) => {
              this.isLoading = false;
              console.error('Error deleting service:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete service',
                life: 5000
              });
              throw err;
            })
          )
          .subscribe({
            next: () => {
              this.isLoading = false;
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Service "${service.serviceName}" deleted successfully`,
                life: 4000
              });
              this.loadWorkshopServices();
            },
            error: () => {
              this.isLoading = false;
            }
          });
      }
    });
  }

  resetWorkshopService(): void {
    this.workshopServiceForm.reset({
      serviceName: '',
      serviceHours: 0
    });
    this.editingService = null;
    this.latestServiceId = '';
  }
 
  // Invoice Template


  loadProductTemplates() {
    this.workshopService
      .getProductTemplates()
      .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response)
          this.ProductTemplates = response;
          this.logger.info('Product Templates Loaded', this.ProductTemplates);
          this.selectedTemplateIndex = 0;
          this.showProductTemplate(0);
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
    // if (!this.newProductTemplate.productTemplateName?.trim()) {
    //   this.messageService.add({
    //     severity: 'warn',
    //     summary: 'Validation',
    //     detail: 'Template name is required',
    //     life: 2000
    //   });
    //   return;
    // }


     this.workshopService
      .upsertProductTemplates(this.newProductTemplate)
      .pipe(
        catchError(err => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: 'Unable to save template. Please try again.',
            life: 3000
          });
          throw err;
        })
      )
      .subscribe((response: any) => {
        this.logger.info('Save Product Template Response:', response);
        if (response) {
          this.loadProductTemplates();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Template added successfully!',
            life: 2000
          });
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
        catchError(err => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: 'Unable to save template. Please try again.',
            life: 3000
          });
          throw err;
        })
      )
      .subscribe((response: any) => {
        this.isLoading = false;

        if (response) {
          this.loadProductTemplates();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Template updated successfully!',
            life: 2000
          });
        }
      });
  }
  
  deleteProductTemplate(templateId: number,templateName:string): void {
   this.confirmationService.confirm({
    message: `Are you sure you want to delete "${templateName}"?`,
    header: 'Confirm Deletion',
    accept: () => {
      this.isLoading = true;
      this.workshopService.deleteProductTemplate(templateId).subscribe(() => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', detail: 'Deleted successfully!' });
        this.loadProductTemplates();
      });
    }
  });
  }
 
  showProductTemplate(index: number): void {
    this.selectedTemplateIndex = index;
    const productTemplateId = this.ProductTemplates[this.selectedTemplateIndex].productTemplateId;
    this.productService.getProductTemplateDetail(productTemplateId).subscribe({
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

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
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

  getProducts(event: AutoCompleteCompleteEvent) {
    let query = event.query;
    this.productService.getProductsByprefix(query).subscribe((response) => {
      this.products = response;
    })

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
      this.isLoading = false;
    }
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
          
        });
  }

  getFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  // Sale Target Tab
  loadSaleTargets(saleYear:string) {
  this.isLoading = true;
  this.saleService.getSaleTarget(saleYear).subscribe({
    next: (res: any) => {
      this.salesList = res.objectList || [];
      this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      console.error("Sales load fail:", err);
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

  this.saleService.upsertSale(payload).subscribe({
    next: () => {
      this.loadSaleTargets(this.selectedSaleYear);
      this.saleTarget.reset({ turnover: 0 });
      this.isLoading = false;
    },
    error: () => this.isLoading = false
  });
}
deleteSaleTarget(sale: any) {
  this.confirmationService.confirm({
    message: 'Are you sure you want to delete this sales target?',
    header: 'Confirm Deletion',
    accept: () => {
      this.isLoading = true;
      this.saleService.deleteSale(sale.wmsId, sale.saleYear, sale.saleMonth).subscribe(() => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', detail: 'Deleted successfully!' });
        this.loadSaleTargets(this.selectedSaleYear);
      });
    }
  });
}

}


// onPageChange(event: any): void {
//     this.pager.firstPage = event.first;
//     this.pager.pageSize = event.rows;
//   }

//   onPageSizeChange(event: any): void {
//     this.pager.pageSize = event.value;
//     this.pager.firstPage = 0;
//   }
// selectTab(index: number) {
//     this.selectedTab = index;
//     if (index === 3) {
//       this.loadServices();
//     }
//   }
  // get isCreateMode(): boolean {
  //   return !this.editingService;
  // }
// resetNewTemplate(): void {
  //   this.newProductTemplate = {
  //     wmsId: this.wmsId,
  //     productTemplateId: 0,
  //     productTemplateName: '',
  //     details: [],
  //   };
  //   this.details.clear();
  //   this.isTagEditing = false;
  //   this.isTemplateEditing = false;
  //   this.editingTemplateIndex = null;
  //   this.editingTagIndex = null;
  // }