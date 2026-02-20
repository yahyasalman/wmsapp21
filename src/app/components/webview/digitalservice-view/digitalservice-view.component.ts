import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SharedService } from 'app/services/shared.service';
import { InvoiceService } from 'app/services/invoice.service';
import { LogService } from 'app/services/log.service';
import { BehaviorSubject, catchError, Observable, switchMap, tap, throwError } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
 
@Component({
  selector: 'digitalservice-view',
  standalone: true,
 imports: [
    ...SHARED_IMPORTS,
    PdfViewerModule
  ],  templateUrl: './digitalservice-view.component.html'
})
export class DigitalServiceViewComponent {
  pdfUrl:any;

  constructor(private logger: LogService,
              private readonly sharedService:SharedService,
              private router: Router,
              private readonly route: ActivatedRoute,
              private readonly invoiceService: InvoiceService,
              private http: HttpClient
              ) {
  }

  ngOnInit(): void {
  const invoiceId = this.route.snapshot.queryParamMap.get('id');
  if (invoiceId)
  this.sharedService
  .printPdfDigitalService('invoice',invoiceId.toString(),'basic')
  .pipe(
    catchError((err) => {
      console.log(err);
      throw err;
    })
  )
  .subscribe((response: any) => {
    if(response){
        var newBlob = new Blob([response], { type: "application/pdf" });
        this.pdfUrl = window.URL.createObjectURL(newBlob);      }
  });
  }      
  
   generatePdf(){
    window.open(this.pdfUrl);
  }
}
