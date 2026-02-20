import { Routes } from '@angular/router';
//import { accountGuard } from 'app/guards/account.guard';
import { authGuard } from 'app/guards/auth.guard';
import { LayoutComponent } from 'app/components/layout/app-layout/layout.component';
import { DashboardListComponent } from 'app/components/dashboard/dashboard-list/dashboard-list.component';
import { HomeComponent } from 'app/components/home/home/home.component';
import { InvoiceListComponent } from 'app/components/invoice/invoice-list/invoice-list.component';
import { InvoiceCrudComponent } from 'app/components/invoice/invoice-crud/invoice-crud.component';
import { InvoiceDetailComponent } from 'app/components/invoice/invoice-detail/invoice-detail.component';
import { BookingListComponent } from 'app/components/booking/booking-list/booking-list.component';
import { ProductListComponent } from 'app/components/product/product-list/product-list.component';
import { CustomerListComponent } from 'app/components/customer/customer-list/customer-list.component';
import { CustomerDetailComponent } from 'app/components/customer/customer-detail/customer-detail.component';
import { CustomerCrudComponent } from 'app/components/customer/customer-crud/customer-crud.component';
import { OfferListComponent } from 'app/components/offer/offer-list/offer-list.component';
import { OfferDetailComponent } from 'app/components/offer/offer-detail/offer-detail.component';
import { OfferCrudComponent } from 'app/components/offer/offer-crud/offer-crud.component';
import { WorkOrderCrudComponent } from 'app/components/workorder/workorder-crud/workorder-crud.component';
import { WorkOrderDetailComponent } from 'app/components/workorder/workorder-detail/workorder-detail.component';
import { WorkOrderListComponent } from 'app/components/workorder/workorder-list/workorder-list.component';
import { SettingCrudComponent } from 'app/components/setting/setting-crud.component';
import { TimesheetListComponent } from 'app/components/employee/timesheet/timesheet-list.component';
import { EnumsLoadedGuard } from 'app/guards/enumsloaded.guard';
import { DigitalServiceListComponent } from 'app/components/digitalservice/digitalservice-list/digitalservice-list.component';
import { DigitalServiceDetailComponent } from 'app/components/digitalservice/digitalservice-detail/digitalservice-detail.component';
import { EmployeeListComponent } from './components/employee/employee-list/employee-list.component';
import { OfferViewComponent } from 'app/components/webview/offer-view/offer-view.component';
import { InvoiceViewComponent } from 'app/components/webview/invoice-view/invoice-view.component';
import { DigitalServiceViewComponent } from './components/webview/digitalservice-view/digitalservice-view.component';
import { ResetPasswordViewComponent } from './components/webview/password-reset/resetpassword-view.component';
import { ForgetPasswordViewComponent } from './components/webview/password-forget/forgetpassword-view.component';
import { EmployeeCrudComponent } from './components/employee/employee-crud/employee-crud.component';
import { PrivacypolicyComponent } from './components/privacypolicy/privacypolicy.component';
import { OptOutComponent } from './components/opt-out/opt-out.component';
import { ProductDetailComponent } from './components/product/product-list/product-detail/product-detail.component';
import { SupplierListComponent } from './components/supplier/supplier-list/supplier-list.component';
import { ReportsComponent } from './components/reports/reports.component';
import { SaleComponent } from './components/sale/sale.component';

export const routes: Routes =  [
  { path: '', component:HomeComponent},
  { path: 'privacy-policy', component:PrivacypolicyComponent},
  { path: 'opt-out', component:OptOutComponent},
  { path: 'webview/offer',   component:OfferViewComponent},
  { path: 'webview/invoice', component:InvoiceViewComponent},
  { path: 'webview/digitalservice', component:DigitalServiceViewComponent},  
  { path: 'webview/resetpassword', component:ResetPasswordViewComponent},
  { path: 'webview/forgetpassword', component:ForgetPasswordViewComponent},
  { path: 'sv',component:LayoutComponent,
    canActivate: [EnumsLoadedGuard],
    children: [ 
              {path: 'dashboard',component:DashboardListComponent},
              {path: 'customer',component:CustomerListComponent},
              {path: 'customer/details/:customerId',component:CustomerDetailComponent},                
              {path: 'customer/crud',component:CustomerCrudComponent},
              {path: 'offer',component:OfferListComponent},
              {path: 'offer/details/:id',component:OfferDetailComponent},
              {path: 'offer/crud',component:OfferCrudComponent},
              {path: 'invoice'  ,component:InvoiceListComponent},
              {path: 'invoice/details/:id',component:InvoiceDetailComponent},
              {path: 'invoice/crud',component:InvoiceCrudComponent},
              {path: 'workorder',component:WorkOrderListComponent},
              {path: 'workorder/details/:workOrderId',component:WorkOrderDetailComponent},                
              {path: 'workorder/crud',component:WorkOrderCrudComponent},
              {path: 'digitalservice',component:DigitalServiceListComponent},
              {path: 'digitalservice/details/:vehiclePlate',component:DigitalServiceDetailComponent},   
              {path: 'product',component:ProductListComponent},
              {path: 'product/details/:id',component:ProductDetailComponent},
              {path: 'supplier',component:SupplierListComponent},
              {path: 'employee',component:EmployeeListComponent},
              {path: 'employee/crud',component:EmployeeCrudComponent},
               {path: 'employee/crud/:id',component:EmployeeCrudComponent},
              {path: 'employment',component:TimesheetListComponent},
              {path: 'booking',component:BookingListComponent},
              {path: 'setting',component:SettingCrudComponent},
              {path: 'reports',component:ReportsComponent},
              {path: 'sales',component:SaleComponent},
              ]
  },
];