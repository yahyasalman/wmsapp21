import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPager } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { SupplierService } from 'app/services/supplier.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [...SHARED_IMPORTS, ProgressSpinnerModule],
  templateUrl: './supplier-list.component.html',
  providers: [ConfirmationService, MessageService],
})
export class SupplierListComponent implements OnInit {

  suppliers: any[] = [];
  supplierForm!: FormGroup;
  filters: FormGroup;
  pager: IPager = <IPager>{};

  isLoading: boolean = true;
  showSupplierDialog = false;
  isNewObject: boolean = true;
  latestSupplierId: number | null = null;

  constructor(
    private logger: LogService,
    public readonly sharedService: SharedService,
    private readonly fb: FormBuilder,
    private supplierService: SupplierService,
    private messageService: MessageService,
    private readonly route: ActivatedRoute,

  ) {
    this.filters = this.fb.group({
      supplierName: '',
      currentPage: 1,
      pageSize: 10,
      sortBy: undefined,
      sortDir: undefined
    });

    this.initSupplierForm();
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => { this.sharedService.updateFiltersFromQueryParams(this.filters, params) });
    this.getSuppliers();

    this.filters.get('supplierName')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filters.patchValue({ currentPage: 1 }, { emitEvent: false });
       this.sharedService.updateFiltersInNavigation(this.filters);
      this.getSuppliers();
    });
  }

  initSupplierForm() {
    this.supplierForm = this.fb.group({
      supplierId: [0],
      supplierName: ['', Validators.required],
      supplierAddress: [''],
      supplierTelephone: [''],
      supplierExtraInfo: ['']
    });
  }

  getSuppliers(): void {
    this.isLoading = true;
    this.supplierService.getSuppliers(this.filters)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response?.objectList && Array.isArray(response.objectList)) {
          this.suppliers = response.objectList;
        } else {
          this.suppliers = [];
        }
        this.isLoading = false;
      });
  }

  onPageChange(e: any) {
    this.filters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
         this.sharedService.updateFiltersInNavigation(this.filters);
    this.getSuppliers();
  }

  onPageSizeChange(event: any) {
    this.filters.patchValue({ pageSize: event.value });
         this.sharedService.updateFiltersInNavigation(this.filters);
    this.getSuppliers();
  }

  supplierCrud(supplierId: number) {
    this.isLoading = true;

    this.supplierService.getSupplier(supplierId).subscribe({
      next: (response: any) => {
        this.showSupplierDialog = true;
        this.isNewObject = (supplierId === 0);
        let data;
        if (Array.isArray(response) && response.length > 0) {
          data = response[0];
        } else {
          data = response.data || response;
        }

        if (data) {
          this.supplierForm.patchValue({
            supplierId: data.supplierId,
            supplierName: data.supplierName,
            supplierAddress: data.supplierAddress,
            supplierTelephone: data.supplierTelephone,
            supplierExtraInfo: data.supplierExtraInfo
          });
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching supplier:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not fetch supplier data'
        });
      }
    });
  }

  onFormSubmit() {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill required fields' });
      return;
    }

    this.isLoading = true;
    const formValues = this.supplierForm.getRawValue();

    this.supplierService.upsertSupplier(formValues).pipe(
      catchError((err) => {
        this.isLoading = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save supplier' });
        throw err;
      })
    ).subscribe((res) => {
      this.isLoading = false;
      if (res) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Supplier saved successfully' });
        this.showSupplierDialog = false;
        this.getSuppliers();
      }
    });
  }


  closeSupplierDialog() {
    this.showSupplierDialog = false;
  }

  sortColumn(e: any) {
    if (e) {
      this.filters.patchValue({
        sortBy: e.sortField,
        sortDir: e.sortOrder
      });
           this.sharedService.updateFiltersInNavigation(this.filters);
      this.getSuppliers();
    }
  }

  onSupplierKeyup(event: any) {
    const query = event.target.value || '';
    this.filters.get('supplierName')?.setValue(query);
  }
  // Helper for HTML validation
  getf(field: string) { return this.supplierForm.get(field); }
}