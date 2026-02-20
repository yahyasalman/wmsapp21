import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICustomerTag, ICustomerType, IWorkshop, ISelect, IPager, IWorkShopService, IProductTemplate, IProduct, IEnums } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { WorkshopService } from 'app/services/workshop.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, Observable } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from '../shared/generic-loader/generic-loader.component';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ProductService } from 'app/services/product.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS
    , GenericLoaderComponent
  ],
  templateUrl: './setting-crud.component.html',
  styleUrl: './setting-crud.component.css',
  providers: [ConfirmationService, MessageService],
})
export class SettingCrudComponent implements OnInit {
  langCode: string = 'en';
  workshop: FormGroup;
  serviceForm: FormGroup;
  // pager: IPager = <IPager>{};
  // Services related properties
  services: IWorkShopService[] = [];
  loadingDelete: boolean = false;
  latestServiceId: string = '';
  editingService: IWorkShopService | null = null;
  isLoading: boolean = false;
  // Pagination properties (outside constructor)
  pager: IPager = <IPager>{
    firstPage: 0,
    pageSize: 10,  // This will show 10 records per page
    totalRecords: 0
  };
  customerTags: ICustomerTag[] = [];
  products: IProduct[] = [];
  ProductTemplates: IProductTemplate[] = [];
  priceMode: number = 0;
  fTaxOptions = [
    { label: 'Ja', value: true },
    { label: 'Nej', value: false }
  ];
  priceModeOptions: IEnums[] = [];
  details: any = new FormArray([])
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

  isTagEditing: boolean = false;
  isTemplateEditing: boolean = false;
  editingTagIndex: number | null = null;
  editingTemplateIndex: number | null = null;
  isTypeEditing: boolean = false;
  editingTypeIndex: number | null = null;
  selectedTab: number = 0;
  isSaving: boolean = false;
  imageUrl: string = '';
  fileKey: string = '';
  wmsId: string = '';
  constructor(
    private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly workshopService: WorkshopService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private productService: ProductService
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
      bankgiro: [],
      swish: [],
      bic: [],
      iban: [],
      priceMode: [],
      isFskat: [false]
    });

    this.serviceForm = this.fb.group({
      serviceName: ['', Validators.required],
      serviceHours: [1, [Validators.required, Validators.min(0)]],
    });

  }

  ngOnInit(){
   
    this.unitOptions = [{
      country: '',
      lang: '',
      key: '',
      value: '',
      index: 0,
      isdefault: false,
      text: '-',
      sverity: ''
    }, ...this.sharedService.getEnums('productUnit')];
    this.priceModeOptions = this.sharedService.getEnums('priceMode')
      .filter((item) => !item.text?.toLowerCase().includes('automatic'));
    // Load workshop data
    this.wmsId = this.sharedService.wmsId;
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

        if (typeof response.isFskat === 'string') {
          response.isFskat = response.isFskat === 'true';
        }

        this.workshop.patchValue(response);
        if (!this.workshop.get('workshopCountry')?.value) {
          this.workshop.patchValue({ workshopCountry: 'Sweden' });
        }
        this.workshop.patchValue({
          priceMode: this.sharedService.getEnumByValue('priceMode', response.priceMode)
        });
      });

    this.loadCustomerTags();
    this.loadCustomerTypes();
    this.loadServices(); // This will load workshop services
    this.loadLogo();
    this.loadProductTemplates();
  }

  selectTab(index: number) {
    this.selectedTab = index;
    if (index === 3) {
      this.loadServices();
    }
  }

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

  // Services CRUD Methods
  loadServices(): void {
    this.handleWithLoader(this.workshopService.getServices(), (response: IWorkShopService[]) => {
      this.services = response || [];
      this.pager.totalRecords = this.services.length;
      this.logger.info('Services loaded:', this.services);
    });
  }

  // onServiceFormSubmit(): void {
  //   this.serviceForm.markAllAsTouched();
  //   if (this.serviceForm.invalid) {
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Validation Error',
  //       detail: 'Please fill in all required fields',
  //       life: 6000
  //     });
  //     return;
  //   }

  //   const serviceData: IWorkShopService = {
  //     serviceName: this.serviceForm.get('serviceName')?.value,
  //     serviceHours: this.serviceForm.get('serviceHours')?.value
  //   };
  //   if (this.editingService && this.editingService.wmsId) {
  //     serviceData.wmsId = this.editingService.wmsId;
  //   }
  //    this.startLoading();
  //   this.workshopService.isWorkshopServiceExists(serviceData.serviceName)
  //     .subscribe({
  //       next: (exists: boolean) => {
  //         if (exists) {
  //           // ⚠️ Already exists — show error message and stop here
  //           this.stopLoading();
  //           this.messageService.add({
  //             severity: 'warn',
  //             summary: 'Duplicate Service',
  //             detail: `Service "${serviceData.serviceName}" already exists!`,
  //             life: 6000
  //           });
  //         } else {
  //           // ✅ Not exists — proceed to save
  //           this.upsertService(serviceData);
  //         }
  //       },
  //       error: (err) => {
  //         this.stopLoading();
  //         this.messageService.add({
  //           severity: 'error',
  //           summary: 'Error',
  //           detail: 'Unable to verify service existence. Please try again.',
  //           life: 6000
  //         });
  //       }
  //     });
  // }
  // upsertService(serviceData: IWorkShopService): void {
  //   this.handleWithLoader(this.workshopService.upsertWorkshopService(serviceData), (response) => {
  //     this.messageService.add({
  //       severity: 'success',
  //       summary: 'Success',
  //       detail: `Service "${serviceData.serviceName}" has been successfully added!`,
  //     });
  //     this.loadServices();
  //     this.resetServiceForm();
  //     this.latestServiceId = response?.wmsId || '';
  //   });
  // }

  onServiceFormSubmit(): void {
    this.serviceForm.markAllAsTouched();

    if (this.serviceForm.invalid) {
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
      serviceName: this.serviceForm.get('serviceName')?.value,
      serviceHours: this.serviceForm.get('serviceHours')?.value,
      // 👇 create k liye 0, edit k liye existing value
      workshopServiceId: this.editingService?.workshopServiceId || 0
    };

    this.startLoading();

    // ✅ Optional: check for duplicates (if required for Create only)
    if (!this.editingService) {
      this.workshopService.isWorkshopServiceExists(serviceData.serviceName)
        .subscribe({
          next: (exists: boolean) => {
            if (exists) {
              this.stopLoading();
              this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Service',
                detail: `Service "${serviceData.serviceName}" already exists!`,
                life: 6000
              });
            } else {
              this.upsertService(serviceData);
            }
          },
          error: () => {
            this.stopLoading();
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Unable to verify service existence. Please try again.',
              life: 6000
            });
          }
        });
    } else {
      this.upsertService(serviceData);
    }
  }

  upsertService(serviceData: IWorkShopService): void {
    this.handleWithLoader(this.workshopService.upsertWorkshopService(serviceData), (response) => {
      const isUpdate = !!serviceData.workshopServiceId && serviceData.workshopServiceId !== 0;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Service "${serviceData.serviceName}" has been successfully ${isUpdate ? 'updated' : 'added'}!`,
      });
      this.loadServices();
      this.resetServiceForm();
      this.latestServiceId = response?.wmsId || '';
    });
  }

  editService(service: IWorkShopService): void {
    this.editingService = { ...service }; // Create a copy to track original values
    this.serviceForm.patchValue({
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

  deleteService(service: IWorkShopService): void {
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
              this.loadServices();
            },
            error: () => {
              this.isLoading = false;
            }
          });
      }
    });
  }


  resetServiceForm(): void {
    this.serviceForm.reset({
      serviceName: '',
      serviceHours: 0
    });
    this.editingService = null;
    this.latestServiceId = '';
  }

  onCancelServiceForm(): void {
    this.resetServiceForm();
  }

  get isCreateMode(): boolean {
    return !this.editingService;
  }
  onPageChange(event: any): void {
    this.pager.firstPage = event.first;
    this.pager.pageSize = event.rows;
  }

  onPageSizeChange(event: any): void {
    this.pager.pageSize = event.value;
    this.pager.firstPage = 0;
  }

  saveTag(): void {

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

          this.resetNewTag();
        });
    }
  }

  editTag(index: number): void {
    const tag = this.customerTags[index];
    this.newCustomerTag = { ...tag };
    this.isTagEditing = true;
    this.editingTagIndex = index;
  }

  resetNewTag(): void {
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

  // saveType(): void {

  //   const alreadyDefault = this.customerTypes.some((t, i) =>
  //     t.isDefault && (!this.isTypeEditing || i !== this.editingTypeIndex)
  //   );

  //   if (this.newCustomerType.isDefault && alreadyDefault) {
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Default Type Error',
  //       detail: 'A default Type already exists. Only one default tag allowed.',
  //       life: 3000
  //     });
  //     return;
  //   }



  //   if (this.newCustomerType.customerTypeName.trim()) {
  //     if (this.isTypeEditing && this.editingTypeIndex !== null) {
  //       this.customerTypes[this.editingTypeIndex] = { ...this.newCustomerType };
  //       this.isTypeEditing = false;
  //       this.editingTypeIndex = null;
  //     } else {
  //       this.newCustomerType.customerTypeId = this.customerTypes.length + 1;
  //     };
  //     this.isLoading = true;
  //     this.workshopService
  //       .upsertCustomerType(this.newCustomerType)
  //       .pipe(
  //         catchError(err => {
  //           this.isLoading = false;
  //           console.error(err);

  //           this.messageService.add({
  //             severity: 'error',
  //             summary: 'Save Failed',
  //             detail: 'Unable to save type. Please try again.',
  //             life: 3000
  //           });

  //           throw err;
  //         })
  //       )
  //       .subscribe((response: any) => {
  //         this.isLoading = false;

  //         if (response) {
  //           this.loadCustomerTypes();

  //           this.messageService.add({
  //             severity: 'success',
  //             summary: 'Success',
  //             detail: this.isTypeEditing ? 'Type updated successfully!' : 'Type added successfully!',
  //             life: 2000
  //           });
  //         }

  //         this.resetNewType();
  //       });
  //   }
  // }
  saveType(): void {

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

          this.resetNewType();
        });
    }
  }

  editType(index: number): void {
    const customerType = this.customerTypes[index];
    this.newCustomerType = { ...customerType };
    this.isTypeEditing = true;
    this.editingTypeIndex = index;
  }

  removeTag(index: number): void {
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
      .deleteCustomerTag(this.wmsId, tag.customerTagId)
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
            this.resetNewTag();
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

  removeType(index: number): void {
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

    this.workshopService.deleteCustomerType(this.wmsId, type.customerTypeId)
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
            this.resetNewType();
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


  resetNewType(): void {
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

  onFormSubmit() {
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
    editedWorkshop.priceMode = Number(this.workshop.get('priceMode')?.value?.value);
    editedWorkshop.isFskat = this.workshop.get('isFskat')?.value === true;

    this.handleWithLoader(this.workshopService.updateWorkshop(editedWorkshop), () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Workshop updated successfully!',
      });
      this.router.navigate(['sv/setting']);
    });
  }

  startLoading(): void {
    this.isLoading = true;
  }

  // Stop loader
  stopLoading(): void {
    this.isLoading = false;
  }

  handleWithLoader<T>(observable: Observable<T>, onSuccess: (res: T) => void): void {
    this.startLoading();
    observable
      .pipe(
        catchError((err) => {
          this.stopLoading();
          console.error('Operation failed:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Something went wrong, please try again.',
            life: 6000,
          });
          throw err;
        })
      )
      .subscribe((response) => {
        this.stopLoading();
        onSuccess(response);
      });
  }

  loadLogo() {
    if (!this.wmsId) return;

    this.isLoading = true;

    this.workshopService.listFiles(this.wmsId)
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
    this.startLoading();
    this.workshopService.uploadFile(file)
      .pipe(
        catchError(err => {
          this.stopLoading();
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
        this.stopLoading();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Image uploaded successfully!',
          life: 4000
        });

        if (response?.key) this.fileKey = response.key;
      });
  }


  // ProductTemplate
  loadProductTemplates() {
    this.workshopService
      .getProductTemplates()
      .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response)
          this.ProductTemplates = response;
      });
  }
  saveProductTemplates(): void {
    // 1. Validation for Name
    if (!this.newProductTemplate.productTemplateName?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Template name is required',
        life: 2000
      });
      return;
    }

    // Map FormArray (details) to Payload
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

    let isUpdate = false;
    if (this.isTemplateEditing && this.editingTemplateIndex !== null) {
      isUpdate = true;
    } else {
      this.newProductTemplate.productTemplateId = 0;
    }

    this.newProductTemplate.details = detailsPayload;
    this.newProductTemplate.wmsId = this.wmsId;

    this.isLoading = true;

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
        this.isLoading = false;

        if (response) {
          this.loadProductTemplates();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: isUpdate ? 'Template updated successfully!' : 'Template added successfully!',
            life: 2000
          });
        }

        // Reset Form and Array
        this.resetNewTemplate();
      });
  }

  editProductTemplate(index: number): void {
    const localTemplate = this.ProductTemplates[index];

    this.newProductTemplate = {
      wmsId: this.wmsId,
      productTemplateId: localTemplate.productTemplateId,
      productTemplateName: localTemplate.productTemplateName,
      details: []
    };

    this.isTemplateEditing = true;
    this.editingTemplateIndex = index;
    this.isLoading = true;

    this.productService.getProductTemplateDetail(this.wmsId, localTemplate.productTemplateId).subscribe({
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
  resetNewTemplate(): void {
    this.newProductTemplate = {
      wmsId: this.wmsId,
      productTemplateId: 0,
      productTemplateName: '',
      details: [],
    };
    this.details.clear();
    this.isTagEditing = false;
    this.isTemplateEditing = false;
    this.editingTemplateIndex = null;
    this.editingTagIndex = null;
  }
  // downloadCurrentImage() {
  //   if (!this.fileKey) return;

  //   this.workshopService.downloadFile(this.fileKey).subscribe(blob => {
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = this.fileKey.split('/').pop() || 'logo.jpg';
  //     a.click();
  //     window.URL.revokeObjectURL(url);
  //   });
  // }

  // code for TemplateDetails//

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

  onDrop(event: any) {
    const prevIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    const dir = currentIndex > prevIndex ? 1 : -1;
    const from = prevIndex;
    const to = currentIndex;

    const temp = this.details.at(from);
    for (let i = from; i * dir < to * dir; i = i + dir) {
      const current = this.details.at(i + dir);
      this.details.setControl(i, current);
    }
    this.details.setControl(to, temp);
  }

  removeDetailRow(rowIndex: number) {
    this.details.removeAt(rowIndex);
    this.details.controls.forEach((item: any, rowIndex: number) => {
      item.patchValue({ rowIndex: rowIndex });
    });
    // this.updateInvoice();
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
        product: productName,
        description: productDescription,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        vatPercentage: vatPercentage
      })
      this.updateDetailRow(detail);
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

    detail.patchValue({ price: price, vat: vat, priceIncVat: priceIncVat, vatPercentage: detail.get('vatPercentage').value.toString() });
    this.logger.info('detail patched with new values');
    this.logger.info(detail.value);

  }

  onChangeVat(detail: any) {
    this.logger.info(detail.value.vatPercentage);

    detail.patchValue({ vatPercentage: detail.value.vatPercentage })
    this.updateDetailRow(detail);
  }
  getFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }
}
