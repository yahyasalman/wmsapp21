import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { IInventory, IInvoiceDetail, IPageList, IProductTemplate, ISelect, } from 'app/app.model';
import { IWorkshop, ICustomer, IProduct } from 'app/app.model';
import { environment } from 'environments/environment';
import { FormGroup } from '@angular/forms';
import { LogService } from 'app/services/log.service';
import { SharedService } from './shared.service';
import { catchError, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  wmsId: string = '';
  country: string = '';
  lang: string = '';
  private baseUrl: string = environment.BASE_URL + '/api/product';
  constructor(private http: HttpClient, private logger: LogService, private sharedService: SharedService) { }

  getProducts(filters: FormGroup) {
    const queryString = this.sharedService.buildQueryParams(filters);
    const url = `${this.baseUrl}/list?${queryString}`;
    return this.http.get<IProduct[]>(url);
  }
  getProductsByCategory(category: string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);  
    queryParams.append("category", category);
    const url = `${this.baseUrl}/list?${queryParams}`;
    return this.http.get<IProduct[]>(url);
  
  }

  getProduct(productId: number | undefined) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    if (productId !== undefined && productId > 0)
      queryParams.append("productId", productId.toString());
    const url = `${this.baseUrl}/detail?${queryParams}`;
    return this.http.get<IProduct>(url);
  }

  getProductsByprefix(prefix: string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("prefix", prefix);
    return this.http.get<IProduct[]>(`${this.baseUrl}/products-by-prefix?${queryParams}`);
  }

  upsertProduct(product: IProduct) {
    product.wmsId = this.sharedService.wmsId;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', });
    return this.http.post<IProduct>(`${this.baseUrl}/upsert-product`, product, { headers });

  }
  upsertInventory(inventory: IInventory) {
    inventory.wmsId = this.sharedService.wmsId;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', });
    return this.http.post<IInventory>(`${this.baseUrl}/insert-inventory`, inventory, { headers });

  }

  deleteProduct(productId: number) {
    const url = `${this.baseUrl}/${this.sharedService.wmsId}/${productId}`;
    return this.http.delete<boolean>(url);
  }
  isProductExists(wmsId: string, productName: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('wmsId', wmsId);
    queryParams.append('productName', productName);

    const url = `${environment.BASE_URL}/api/Product/is-product-exists?${queryParams.toString()}`;
    return this.http.get<boolean>(url);
  }
  // Templates 
  getDetailTemplates() {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    const url = `${this.baseUrl}/templates?${queryParams}`;
    return this.http.get<IProductTemplate[]>(url);
  }

  getDetailTemplate(templateId: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("productTemplateId", templateId.toString());
    const url = `${this.baseUrl}/template-detail?${queryParams}`;
    return this.http.get<IProduct[]>(url);
  }

  getTemplates(wmsId: string) {
    const url = `${this.baseUrl}/template/list?wmsId=${wmsId}`;
    return this.http.get<any>(url);
  }

 
 
  getInventories(filters: FormGroup) {
    const queryString = this.sharedService.buildQueryParams(filters);
    const url = `${this.baseUrl}/list-inventory?${queryString}`;
    return this.http.get<IPageList<IInventory>>(url);
  }



  getProductTemplateDetail(productTemplateId: number): Observable<any> {
    let params = new HttpParams()
      .set('wmsId', this.sharedService.wmsId)
      .set('productTemplateId', productTemplateId.toString());
    return this.http.get<any>(this.baseUrl + '/template-detail', { params: params });
  }

  getProductSales(filters: FormGroup) {
    const queryString = this.sharedService.buildQueryParams(filters);
    const url = `${this.baseUrl}/list-sales?${queryString}`;
    return this.http.get<IPageList<IInvoiceDetail>>(url);
  }
setProductStatus(wmsId: string, productId: number, isActive: boolean) {
  return this.http.get(`${this.baseUrl}/set-product-status`, {
    params: { wmsId, productId, isActive: isActive.toString() }
  });
}
}