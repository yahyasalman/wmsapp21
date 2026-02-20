import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GenericLoaderComponent } from '../shared/generic-loader/generic-loader.component';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { SaleService } from 'app/services/sale.service ';
import { SharedService } from 'app/services';
import { IPager, ISale } from 'app/app.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError } from 'rxjs';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.css'],
   imports: [...SHARED_IMPORTS, GenericLoaderComponent],
   providers: [ConfirmationService, MessageService]
})
export class SaleComponent implements OnInit {
  salesForm!: FormGroup;
  isLoading: boolean = false;
  isEditMode: boolean = false;
  salesList: any[] = []; // Your list of sale objects
 pager: IPager = <IPager>{};
  constructor(private fb: FormBuilder,private saleService: SaleService, public readonly sharedService: SharedService,
      private router: Router,
      private readonly route: ActivatedRoute,
      private messageService: MessageService,
      private confirmationService: ConfirmationService,
  ) {

     this.salesForm = this.fb.group({
      wmsId: [null],
      datePeriod: [null, Validators.required], // This holds the Date object
      turnover: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.loadAllSales();
  }





  
onSalesSubmit() {
  if (this.salesForm.invalid) return;

  this.isLoading = true;
  const rawValue = this.salesForm.value;
  const selectedDate = rawValue.datePeriod as Date;

  const payload = {
     wmsId: this.sharedService.wmsId,
    saleYear: selectedDate.getFullYear(),
    saleMonth: selectedDate.getMonth() + 1,
    turnover: rawValue.turnover
  };

  this.saleService.upsertSale(payload).subscribe({
    next: (res) => {
      this.loadAllSales();
      this.resetForm();
       this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      console.error(err);
    }
  });
}

loadAllSales() {
  this.isLoading = true;
  this.saleService.getAllSales().subscribe({
    next: (res: any) => {
      this.salesList = res.objectList || [];
      
      if (res.pager) {
        this.pager = res.pager;
      }
      
      this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      this.salesList = [];
      console.error("Data load fail:", err);
    }
  });
}
deleteSale(sale: any) {
  const message = 'Are you sure you want to delete this sales target?';

  this.confirmationService.confirm({
    message: message,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes',
    rejectLabel: 'No',
    acceptButtonStyleClass: 'p-button-danger',
    accept: () => {
      this.isLoading = true;
      this.saleService.deleteSale(sale.wmsId, sale.saleYear, sale.saleMonth)
        .pipe(
          catchError((err) => {
            this.isLoading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Operation failed!' });
            throw err;
          })
        )
        .subscribe((res) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Sales target deleted successfully!'
          });
          this.loadAllSales(); // Table refresh karein
        });
    },
  });
}
  resetForm() {
    this.isEditMode = false;
    this.salesForm.reset({ turnover: 0 });
  }

   onPageChange(e: any) {
    this.salesForm.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
    this.router.navigate([],
      {
        relativeTo: this.route,
        queryParams: { page: e.page + 1 },
        queryParamsHandling: 'merge',
      });
    this.sharedService.updateFiltersInNavigation(this.salesForm);
    this.loadAllSales();
  }

  onPageSizeChange(event: any) {
    this.salesForm.patchValue({ pageSize: event.value });
    this.sharedService.updateFiltersInNavigation(this.salesForm);
    this.loadAllSales();
  }
}