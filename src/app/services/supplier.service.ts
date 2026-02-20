import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IPageList, ISupplier} from 'app/app.model';
import { environment } from 'environments/environment';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class SupplierService {

  private baseUrl: string = environment.BASE_URL + '/api/supplier';
  
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {}

   getSuppliers(filters: FormGroup) {
    const queryString = this.sharedService.buildQueryParams(filters);
    const url = `${this.baseUrl}/list?${queryString}`;
    return this.http.get<IPageList<ISupplier>>(url);
  }
  getAllSuppliers() {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    const url = `${this.baseUrl}/all?${queryParams}`;
    return this.http.get<ISupplier[]>(url);
  }

    getSuppliersByprefix(prefix:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("prefix", prefix);
    const url = `${this.baseUrl}/suppliers-by-prefix?${queryParams}`;
    return this.http.get<ISupplier[]>(url);
  }

 getSupplier(supplierId: number | undefined) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    if (supplierId !== undefined && supplierId > 0)
      queryParams.append("supplierId", supplierId.toString());
    const url = `${this.baseUrl}/detail?${queryParams}`;
    return this.http.get<ISupplier>(url);
  }
  upsertSupplier(supplier: ISupplier) {
    supplier.wmsId = this.sharedService.wmsId;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', });
    return this.http.post<ISupplier>(`${this.baseUrl}/upsert-supplier`, supplier, { headers });

  }

}
