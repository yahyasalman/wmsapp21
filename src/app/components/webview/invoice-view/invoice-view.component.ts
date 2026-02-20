import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ITokenClaims } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { InvoiceService } from 'app/services/invoice.service';
import { LogService } from 'app/services/log.service';
import {catchError} from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';

 
@Component({
  selector: 'app-invoice-detail',
  standalone: true,
 imports: [
    ...SHARED_IMPORTS,
    PdfViewerModule
  ],  templateUrl: './invoice-view.component.html'
})
export class InvoiceViewComponent {
  token:string = ''; 
  workshopName:string = ''; 
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
  this.token = this.route.snapshot.queryParams['token']||''; 
this.sharedService
  .getClaimsFromToken(this.token)
  .pipe(
    catchError((err) => {
      console.log(err);
      throw err;
    })
  )
  .subscribe((response: ITokenClaims) => {
    if(response){
      this.workshopName = response.workshopName;  
    }
  });

  this.sharedService
  .printPdfFromToken(this.token)
  .pipe(
    catchError((err) => {
      console.log(err);
      throw err;
    })
  )
  .subscribe((response: any) => {
    if(response){
        var newBlob = new Blob([response], { type: "application/pdf" });
        this.pdfUrl = window.URL.createObjectURL(newBlob);
      }
  });
  }      
  
 
  generatePdf(){
    window.open(this.pdfUrl);
  }
}
