import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPageList, ISale} from 'app/app.model';
import { environment } from 'environments/environment';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';

@Injectable({ providedIn: 'root' })

export class SaleService {

  private baseUrl: string = environment.BASE_URL + '/api/workshop';
  
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {}

  getAllSales() {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    const url = `${this.baseUrl}/workshop-sale-taget?${queryParams}`;
    return this.http.get<ISale[]>(url);
  }


  upsertSale(sale: ISale) {
    sale.wmsId = this.sharedService.wmsId;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', });
    return this.http.post<ISale>(`${this.baseUrl}/insert-sale-target`, sale, { headers });

  }
deleteSale(wmsId: string, saleYear: number, saleMonth: number) {
  // Query parameters create karein
  const params = new HttpParams()
    .set('wmsId', wmsId)
    .set('saleYear', saleYear.toString())
    .set('saleMonth', saleMonth.toString());

  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
  // Post request with query params
  return this.http.post(`${this.baseUrl}/delete-sale-target`, {}, { headers, params });
}
}
