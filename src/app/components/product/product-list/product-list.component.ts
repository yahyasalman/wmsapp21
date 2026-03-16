import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IProduct, IPager, IInventory } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { ProductService } from 'app/services/product.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, switchMap } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { ActivatedRoute, Router } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';


@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS, IconFieldModule,InputIconModule,ProgressSpinnerModule
  ],
  styleUrl: './product-list.component.css',
  templateUrl: './product-list.component.html',
  providers: [ConfirmationService, MessageService],

})
export class ProductListComponent {
  products: IProduct[] = [];
  product!: FormGroup;
  filters: FormGroup;
  inventoryForm!: FormGroup;
  uccessProductLabel: string = '';
  failProductLabel: string = '';
  latestProductId: number | null = null;
  loadingDelete: boolean = false;
  isLoading: boolean = true;
  showProductDialog = false;
  successProductLabel: string = '';
  isInventoryChecked: boolean = false;
  isSelingProductChecked: boolean = false;
  isNewObject: boolean = true;
  showInventoryDialog = false;
  selectedProduct: any = null;
  originalProductName: string = '';
  selectedPriceIncvat = 0;
  selectedTotalPaid = 0;
  selectedRemainingBalance = 0;
  selectedProducts: any[] = [];
  currentProductId: number = 0;
  hideDeletedProducts = true;
  constructor(
    private logger: LogService,
    public readonly sharedService: SharedService,
    private readonly fb: FormBuilder,
    private productService: ProductService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private readonly route: ActivatedRoute,
  ) {

    this.filters = this.fb.group({
      category: null,
      inventory: false,
      sale: false,
      isActive: 1,
    });

    this.productForm();
    this.InventoryForm();

  }
  ngOnInit() {
    this.isLoading = true;
    //this.route.queryParams.subscribe((params) => { this.sharedService.updateFiltersFromQueryParams(this.filters, params) });
    this.getProducts();
    /// instant search on input///
    // this.filters.get('productName')?.valueChanges.pipe(
    //   debounceTime(300),
    //   distinctUntilChanged()
    // ).subscribe(() => {
    //   this.filters.patchValue({ currentPage: 1 }, { emitEvent: false });
    //   this.sharedService.updateFiltersInNavigation(this.filters);
    //   this.getProducts();
    // });
  }
  InventoryForm() {
    this.inventoryForm = this.fb.group({
      inventoryDate: [new Date().toISOString().split('T')[0], Validators.required],
      inventoryQuantity: [0, Validators.required],
      inventoryNote: ['']
    });
  }
  productForm() {
    this.product = this.fb.group({
      productId: [0],
      category: [this.sharedService.getDefaultEnum('detailCategory').text, Validators.required],
      productName: ['', Validators.required],
      productDescription: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: [this.sharedService.getDefaultEnum('productUnit').value, Validators.required],
      unitPrice: [0, Validators.required],
      vat: [this.sharedService.getDefaultEnum('vatPercentage').value],
      priceIncVat: [''],
      isUpdate: [false],
    });
  }

  getProducts(): void {
    this.isLoading = true; 
    const filterValues = this.filters.value;
    this.logger.info('getProducts started');
    this.logger.info(this.filters);
    this.productService.getProducts(this.filters)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false; // 🔴 Stop loader on error
          throw err;
        })
      )
      .subscribe((res) => {
        this.logger.info('ompleted...');
        this.products = res;
        this.logger.info(this.products);
        this.isLoading = false;
      });
  }

  // onPageChange(e: any) {
  //   this.filters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
  //   this.getProducts();
  // }
  // onPageChange(e: any) {
  //   this.filters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
  //   this.router.navigate([],
  //     {
  //       relativeTo: this.route,
  //       queryParams: { page: e.page + 1 },
  //       queryParamsHandling: 'merge',
  //     });
  //   this.sharedService.updateFiltersInNavigation(this.filters);
  //   this.getProducts();
  // }

  onPageSizeChange(event: any) {
    this.filters.patchValue({ pageSize: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getProducts();
  }

  onChangeProductQuantity(e: any) {
    let price = e.target.value * this.product.get('unitPrice')?.value;
    let vat = price * (this.product.get('vat')?.value / 100);
    let priceIncVat = price + vat;
    this.product.patchValue({ priceIncVat: priceIncVat })
  }

  onChangeUnitPrice(e: any) {
    let price = e.target.value * this.product.get('quantity')?.value;
    let vat = price * (this.product.get('vat')?.value / 100);
    let priceIncVat = price + vat;
    this.product.patchValue({ priceIncVat: priceIncVat })
  }


  onChangeVat(e: any) {
    let price = this.product.get('unitPrice')?.value * this.product.get('quantity')?.value;
    let vat = price * (e.value / 100);
    let priceIncVat = price + vat;
    this.product.patchValue({ priceIncVat: priceIncVat })
  }

  //validation//
  getf(field: string) {
    return this.product.get(field);
  }

  productCrud(productId: number) {
    this.productService.getProduct(productId).subscribe((response: any) => {
      this.isNewObject = response.isNewObject;
      this.showProductDialog = true;

      if (!productId) {
        this.product.patchValue(response.data);
        this.originalProductName = '';

        // vat default
        const vatList = this.sharedService.getEnums('vatPercentage');
        if (vatList && vatList.length > 0) {
          this.product.patchValue({ vat: vatList[0].value });
        }
      } else {
        // UPDATE CASE
        const data = response.data;
        this.originalProductName = data.productName;
        this.product.patchValue({
          ...data,
          category: data.category || this.sharedService.getDefaultEnum('detailCategory')?.value,
          unit: data.productUnit || this.sharedService.getDefaultEnum('productUnit')?.value,
          vat: data.vat ? data.vat.toString() : this.sharedService.getDefaultEnum('vatPercentage')?.value,
        });
      }
    });
  }

  // deleteProduct(productId: number) {
  //   this.confirmationService.confirm({
  //     message: 'Are you sure you want to delete this product?',
  //     header: 'Confirm Delete',
  //     icon: 'pi pi-exclamation-triangle',
  //     acceptLabel: 'Yes',
  //     rejectLabel: 'No',
  //     acceptButtonStyleClass: 'p-button-danger',
  //     rejectButtonStyleClass: 'p-button-secondary',
  //     accept: () => {
  //       this.isLoading = true;

  //       this.productService
  //         .deleteProduct(productId)
  //         .pipe(
  //           catchError((err) => {
  //             this.isLoading = false; // 🔹 stop loading
  //             this.logger.error(err);
  //             this.messageService.add({
  //               severity: 'error',
  //               summary: 'Error',
  //               detail: 'Failed to delete product!',
  //               life: 6000,
  //             });
  //             throw err;
  //           })
  //         )
  //         .subscribe((res) => {
  //           this.isLoading = false; // 🔹 stop loading

  //           if (res) {
  //             this.messageService.add({
  //               severity: 'success',
  //               summary: 'Deleted',
  //               detail: 'Product deleted successfully!',
  //               life: 6000,
  //             });
  //             this.logger.info('Product deleted successfully');
  //             this.getProducts();
  //           } else {
  //             this.messageService.add({
  //               severity: 'warn',
  //               summary: 'Not Found',
  //               detail: 'Product could not be deleted!',
  //               life: 6000,
  //             });
  //           }
  //         });
  //     },
  //   });
  // }
  deleteProduct(product: any) {
    // Agar isActive 0 hai (disabled), to newStatus true (1) hoga taake enable ho sake
    const newStatus = product.isActive === 0;

    // Translation labels ke mutabiq messages
    const actionText = newStatus ? 'enable' : 'disable';
    const message = newStatus
      ? 'Are you sure you want to enable this product?'
      : 'Are you sure you want to disable this product?';

    this.confirmationService.confirm({
      message: message,
      header: 'Confirm Status Change',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      // Button hamesha red rakhne ke liye aap 'p-button-danger' hi rehne de sakte hain
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isLoading = true;

        this.productService.setProductStatus(this.sharedService.wmsId, product.productId, newStatus)
          .pipe(
            catchError((err) => {
              this.isLoading = false;
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Operation failed!' });
              throw err;
            })
          )
          .subscribe((res) => {
            this.isLoading = false;
            if (res) {
              this.messageService.add({
                severity: 'success',
                summary: 'Status Updated',
                detail: `Product ${actionText}d successfully!`
              });
              this.getProducts(); // List refresh karein
            }
          });
      },
    });
  }
  async onFormSubmit() {
    this.product.markAllAsTouched();
    if (this.product.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields.',
      });
      return;
    }

    this.isLoading = true;
    const product: IProduct = this.product.value;
    const currentProductName = product.productName.trim();

    try {
      if (
        this.isNewObject ||
        (!this.isNewObject && currentProductName.toLowerCase() !== this.originalProductName.toLowerCase())
      ) {

        const exists = await firstValueFrom(
          this.productService.isProductExists(this.sharedService.wmsId, currentProductName)
        );

        if (exists) {
          this.isLoading = false;
          this.messageService.add({
            severity: 'warn',
            summary: 'Duplicate Product',
            detail: `Product "${currentProductName}" already exists!`,
            life: 6000
          });
          return;
        }
      }
      const res: any = await firstValueFrom(
        this.productService.upsertProduct(product).pipe(
          catchError((err) => {
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to save product!',
            });
            throw err;
          })
        )
      );

      // ✅ Success Handling
      this.isLoading = false;

      // Ab ye error nahi dega
      if (res === true || res?.success === true || res?.productId) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Product "${currentProductName}" saved successfully!`,
        });
        this.getProducts();
        this.productForm();
        this.closeProductDialog();
      }

    } catch (error) {
      this.isLoading = false;
      console.error('Form submission failed:', error);
    }
  }

  onChangeCategory(event: any) {
    const value = event?.value || '';
    this.filters.patchValue({ category: value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getProducts();
  }

  onClearCategory() {
    this.filters.patchValue({ category: '' });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getProducts();
  }

  onProductKeyup(event: any) {
    // const query = event.target.value || '';
    // this.filters.get('productName')?.setValue(query);
  }

  closeProductDialog() {
    this.showProductDialog = false;
  }

  onChangeCurrentWorkshop(event: any): void {
    const checked = event.checked;
    this.filters.patchValue({ inventory: checked });
    //this.filters.patchValue({ currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getProducts();
  }
  onChangeSellingProduct(event: any): void {
    const checked = event.checked;
    this.filters.patchValue({ sale: checked });
    this.filters.patchValue({ currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getProducts();
  }
  ///inventory related functions//

  loadInventories(productId: number | undefined) {
    // this.productService.getInventories(productId)
    //   .subscribe((response: IInventory[]) => {
    //     this.selectedProducts = response.map(inv => ({
    //       inventoryDate: inv.inventoryDate,
    //       inventoryQuantity: inv.inventoryQuantity,
    //       inventoryNote: inv.inventoryNote,
    //       wmsId: inv.wmsId,
    //       productId: inv.productId,
    //       inventoryId: inv.inventoryId
    //     }));
    //     const totalQuantity = this.selectedProducts.reduce((sum: any, item: any) => sum + (item.inventoryQuantity || 0), 0);

    //     this.selectedPriceIncvat = totalQuantity;
    //     console.log('Inventories loaded:', this.selectedProducts);
    //   });
  }

  openInventoryDialog(productId: any) {
    this.currentProductId = productId;
    this.showInventoryDialog = true;
    this.InventoryForm();
    // this.loadInventories(productId);
  }

  closeInventoryDialog() {
    this.showInventoryDialog = false;
    this.selectedProduct = null;
  }

  onCloseInventoryDialog() {
    this.showInventoryDialog = false
  }

  upsertInventory() {
    if (this.inventoryForm.invalid) {
      return;
    }
    const inventoryDate = this.inventoryForm.get('inventoryDate')?.value;
    const inventoryQuantity = this.inventoryForm.get('inventoryQuantity')?.value;
    const inventoryNote = this.inventoryForm.get('inventoryNote')?.value || '';

    this.logger.info('Upserting inventory :', inventoryDate, inventoryQuantity, inventoryNote);

    // NOTE: 'Inventory New Id get'
    this.sharedService.getNextId('Inventory').pipe(
      switchMap((newId: number) => {
        this.isLoading = true;
        const payload: IInventory = {
          wmsId: this.sharedService.wmsId,
          productId: this.currentProductId,
          inventoryId: newId,
          inventoryDate: inventoryDate,
          inventoryQuantity: inventoryQuantity,
          inventoryNote: inventoryNote
        };


        return this.productService.upsertInventory(payload);
      })
    ).subscribe({
      next: (res) => {
        console.log('Saved:', res);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Inventory saved successfully'
        });
        this.showInventoryDialog = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error saving inventory:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save inventory'
        });
      }
    });
  }

  // sortColumn(e: any) {
  //   if (e) {
  //     let pageIndex = e.first / e.rows;
  //     // If the current page is already set, use it instead of resetting
  //     if (this.filters.get('currentPage')?.value) {
  //       pageIndex = +this.filters.get('currentPage')?.value - 1; // Convert to zero-based index
  //     }
  //     // Update the pager and filters
  //     this.pager.firstPage = e.first;
  //     this.filters.patchValue({
  //       currentPage: (pageIndex + 1).toString(), // Convert back to one-based index
  //       pageSize: e.rows,
  //       sortDir: e.sortOrder,
  //       sortBy: e.sortField,
  //     });
  //     this.getProducts();
  //   }
  // }


  onCancel() {
    this.onCloseInventoryDialog();
  }

  redirectToProductDetail(productId: number) {
    // Yahan ap apna route path check kr len. 
    // Agr apka route 'sv/product/details/:id' hai to 'sv/' add karein.
    this.router.navigate(['sv/product/details', productId]);
  }


  HideDeletedProducts(event: any) {
    const checked = event.checked;
    this.filters.patchValue({
      isActive: checked ? 1 : ''
    });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getProducts();
  }
}
