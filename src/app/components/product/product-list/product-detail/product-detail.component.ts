import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedService } from 'app/services/shared.service';
import { ProductService } from 'app/services/product.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { IInventory, IProduct, IPager } from 'app/app.model'; // IPager import zaroori hai
import { switchMap, catchError } from 'rxjs';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS, GenericLoaderComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {

  productId: number = 0;
  product: any = {};
  isLoading: boolean = false;

  inventories: any[] = [];
  inventoryForm!: FormGroup;
  showInventoryDialog: boolean = false;

  inventoryPager: IPager = <IPager>{};
  inventoryFilters: FormGroup;
  sales: any[] = [];
  salesPager: IPager = <IPager>{};

  editProductForm!: FormGroup;
  showProductDialog: boolean = false;
  salesFilters: FormGroup;
  productCategory:string = '';
  constructor(
    public readonly sharedService: SharedService,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private messageService: MessageService,
    private fb: FormBuilder,
  ) {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));

    this.inventoryFilters = this.fb.group({
      productId: this.productId,
      currentPage: 1,
      pageSize: 10,
      wmsId: this.sharedService.wmsId
    });
    this.salesFilters = this.fb.group({
      productId: this.productId,
      currentPage: 1,
      pageSize: 10,
      sortBy: '',
      sortDir: -1
    });
    this.initInventoryForm();
    this.initProductForm();
  }

  ngOnInit() {
    if (this.productId) {
      this.getProductDetails();
      this.loadInventories();
      this.loadProductSales();
    }
  }

  initProductForm() {
    this.editProductForm = this.fb.group({
      productId: [0],
      category: [this.sharedService.getDefaultEnum('detailCategory').text, Validators.required],
      productName: ['', Validators.required],
      productDescription: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: [this.sharedService.getDefaultEnum('productUnit').value, Validators.required],
      unitPrice: [0, Validators.required],
      vat: [this.sharedService.getDefaultEnum('vatPercentage').value],
      priceIncVat: [''],
      isUpdate: [true],
    });
  }

  getProductDetails() {
    this.isLoading = true;
    this.productService.getProduct(this.productId).subscribe({
      next: (res: any) => {
        this.product = res.data || res;
        this.productCategory = this.sharedService.getEnumByValue('detailCategory',this.product.category).text;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }


  closeProductDialog() {
    this.showProductDialog = false;
  }

  onUpdateProduct() {
    this.editProductForm.markAllAsTouched();
    if (this.editProductForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields.' });
      return;
    }
    this.isLoading = true;
    const productPayload: IProduct = this.editProductForm.value;
    this.productService.upsertProduct(productPayload).pipe(
      catchError((err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update product!' });
        throw err;
      })
    )
      .subscribe((res: any) => {
        this.isLoading = false;
        if (res === true || res?.success === true || res?.productId) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `Product updated successfully!` });
          this.getProductDetails();
          this.closeProductDialog();
        }
      });
  }

  openEditProductDialog() {
    this.showProductDialog = true;
    if (this.product) {
      this.editProductForm.patchValue({
        ...this.product,
        category: this.product.category || this.sharedService.getDefaultEnum('detailCategory')?.value,
        unit: this.product.unit || this.sharedService.getDefaultEnum('productUnit')?.value,
        vat: this.product.vat ? this.product.vat.toString() : this.sharedService.getDefaultEnum('vatPercentage')?.value,
      });
      this.recalculatePrice();
    }
  }



  onChangeProductQuantity(e: any) { this.recalculatePrice(); }
  onChangeUnitPrice(e: any) { this.recalculatePrice(); }
  onChangeVat(e: any) { this.recalculatePrice(); }

  
  recalculatePrice() {
    const qty = this.editProductForm.get('quantity')?.value || 0;
    const unitPrice = this.editProductForm.get('unitPrice')?.value || 0;
    const vatPercent = this.editProductForm.get('vat')?.value || 0;
    let price = qty * unitPrice;
    let vatAmount = price * (vatPercent / 100);
    let priceIncVat = price + vatAmount;
    this.editProductForm.patchValue({ priceIncVat: priceIncVat }, { emitEvent: false });
  }

  getf(field: string) { return this.editProductForm.get(field); }

  redirectToProductCrud() {
  }


  //inventory related functions

  loadInventories(): void {
    this.isLoading = true;

    this.productService.getInventories(this.inventoryFilters)
      .pipe(
        catchError((err) => {
          // this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        this.inventories = res?.objectList || [];
        this.inventoryPager = res?.pager;
        this.isLoading = false;
      });
  }

  onInventoryPageChange(e: any) {
    this.inventoryFilters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
    this.router.navigate([],
      {
        relativeTo: this.route,
        queryParams: { page: e.page + 1 },
        queryParamsHandling: 'merge',
      });

    this.loadInventories();
  }

  onInventoryPageSizeChange(event: any) {
    this.inventoryFilters.patchValue({ pageSize: event.value });
    this.loadInventories();
  }

  sortColumn(e: any) {
    if (e) {
      let pageIndex = e.first / e.rows;
      // If the current page is already set, use it instead of resetting
      if (this.inventoryFilters.get('currentPage')?.value) {
        pageIndex = +this.inventoryFilters.get('currentPage')?.value - 1; // Convert to zero-based index
      }
      // Update the pager and filters
      this.inventoryPager.firstPage = e.first;
      this.inventoryFilters.patchValue({
        currentPage: (pageIndex + 1).toString(), // Convert back to one-based index
        pageSize: e.rows,
        sortDir: e.sortOrder,
        sortBy: e.sortField,
      });
      this.loadInventories();
    }
  }


  initInventoryForm() {
    this.inventoryForm = this.fb.group({
      inventoryDate: [new Date().toISOString().split('T')[0], Validators.required],
      inventoryQuantity: [0, Validators.required],
      inventoryNote: ['']
    });
  }

  openInventoryDialog() {
    this.showInventoryDialog = true;
    this.initInventoryForm();
  }

  onCloseInventoryDialog() {
    this.showInventoryDialog = false;
  }

  upsertInventory() {
    if (this.inventoryForm.invalid) { return; }
    const inventoryDate = this.inventoryForm.get('inventoryDate')?.value;
    const inventoryQuantity = this.inventoryForm.get('inventoryQuantity')?.value;
    const inventoryNote = this.inventoryForm.get('inventoryNote')?.value || '';

    this.sharedService.getNextId('Inventory').pipe(
      switchMap((newId: number) => {
        this.isLoading = true;
        const payload: IInventory = {
          wmsId: this.sharedService.wmsId,
          productId: this.productId,
          inventoryId: newId,
          inventoryDate: inventoryDate,
          inventoryQuantity: inventoryQuantity,
          inventoryNote: inventoryNote
        };
        return this.productService.upsertInventory(payload);
      })
    ).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Inventory saved successfully' });
        this.showInventoryDialog = false;
        this.isLoading = false;
        this.loadInventories();
        this.getProductDetails();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save inventory' });
      }
    });
  }


  ///productsales related function

  loadProductSales(): void {
    this.isLoading = true;

    this.productService.getProductSales(this.salesFilters)
      .pipe(
        catchError((err) => {
          // this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        this.sales = res?.objectList || [];
        console.log('Sales Data:', this.sales);
        this.salesPager = res?.pager;
        this.isLoading = false;
      });
  }


  onSalesPageChange(event: any) {
    this.salesFilters.patchValue({
      currentPage: event.page + 1,
      pageSize: event.rows
    });
    this.loadProductSales();
  }

  onSalesPageSizeChange(event: any) {
    this.salesFilters.patchValue({
      pageSize: event.value,
      currentPage: 1
    });
    this.loadProductSales();
  }
  redirectToInvoiceDetailComponent(invoiceId: number) {
    this.router.navigate([`sv/invoice/details/${invoiceId}`]);
  }
}