import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import {ITokenClaims} from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { OfferService } from 'app/services/offer.service';
import { LogService } from 'app/services/log.service';
import { catchError, filter, tap } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';


@Component({
  selector: 'app-offer-view',
  standalone: true,
 imports: [
    ...SHARED_IMPORTS,
    PdfViewerModule
  ],  templateUrl: './offer-view.component.html'
})
export class OfferViewComponent {
token:string = ''
wmsId:string = '';
workshopName:string = ''; 
offerId:string = '';
acceptRejectDate: string = '';
isButtonDisabled:boolean = false;
pdfUrl:any;
status:string = 'wait';
statusText:string = 'Väntar på svar'

  constructor(private logger: LogService,
              private readonly sharedService:SharedService,
              private router: Router,
              private readonly route: ActivatedRoute,
              private readonly offerService: OfferService,
              private http: HttpClient
              ) {

  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token']||''; 
    //this.sharedService.setPageHeader(this.translateService.instant('applayout.offer') + ' [#' + this.offerId + ']');
    this.loadOffer();
    this.loadPdf();
}

loadOffer()
{
      this.sharedService
    .getClaimsFromToken(this.token)
    .pipe(
      tap((response: ITokenClaims) => {
        if (response) {
          this.wmsId = response.wmsId;
          this.workshopName = response.workshopName;
          this.offerId = response.id;
        }
      }),
      filter(() => !!this.wmsId && !!this.offerId), // proceed only when both have values
      tap(() => this.getOfferStatus()),
      catchError((err) => {
        console.log(err);
        throw err;
      })
    )
    .subscribe();

}


getOfferStatus(){
  this.sharedService
  .getOfferStatus(this.wmsId, Number(this.offerId))
  .pipe(
    catchError((err) => {
      console.log(err);
      throw err;
    })
  )
  .subscribe((response: any) => {
    if(response){
        this.status = response.status;
        this.acceptRejectDate = response.date;
        if(this.status === 'accepted')
        {
          this.statusText = 'Offert accepterad den ' + this.acceptRejectDate;
        }
        else if(this.status === 'rejected')
        {
          this.statusText = 'Offert avvisad den ' + this.acceptRejectDate;  
        }
      } 
  });
}

loadPdf(){
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
        this.pdfUrl = window.URL.createObjectURL(newBlob);      }
  });
}

generatePdf(){
    window.open(this.pdfUrl);
  }
  
  updateStatus(accepted:boolean)
  {
    this.sharedService
    .updateCustomerOffer(this.wmsId, Number(this.offerId), accepted)
    .pipe(
      catchError((err) => {
        console.log(err);
        throw err;
      })
    )
    .subscribe((res: any) => {
      if (res) {
            this.loadOffer();
            this.loadPdf();
      }
    });
  }
}

