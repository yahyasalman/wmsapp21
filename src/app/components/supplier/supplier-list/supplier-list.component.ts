import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IPager } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { SupplierService } from 'app/services/supplier.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, debounceTime, distinctUntilChanged, finalize, takeUntil, Subject } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ProgressSpinnerModule,
    TableModule,
    PaginatorModule,
    DialogModule
  ],
  templateUrl: './supplier-list.component.html',
  providers: [ConfirmationService, MessageService],
})
export class SupplierListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
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
      distinctUntilChanged(),
      takeUntil(this.destroy$)
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
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response?.objectList && Array.isArray(response.objectList)) {
            this.suppliers = response.objectList;
          } else {
            this.suppliers = [];
          }
        },
        error: (err) => {
          this.logger.error(err);
        }
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

    this.supplierService.getSupplier(supplierId)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
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
        },
        error: (err) => {
          this.logger.error('Error fetching supplier:', err);
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

    this.supplierService.upsertSupplier(formValues)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.messageService.add({ severity: 'success', summary: this.sharedService.T('success'), icon: 'pi pi-check-circle' });
            this.showSupplierDialog = false;
            this.getSuppliers();
          }
        },
        error: (err) => {
          this.logger.error('Error saving supplier:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save supplier' });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}