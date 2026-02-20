export type PdfObject = 'workorder' | 'invoice' | 'offer';

export interface IVehicle {
  name: string,
  models: string[]
}
export interface ITranslate {
  tkey: string,
  en: string,
  sv: string
}

export interface WmsUser {
  Email: string,
  password: string,
  email: string,
  role: string,
  wmsId: string,
  displayName: string,
  country: string,
  token: string,
}
export interface ResetPassword {
  Email: string,
  token: string,
  newPassword: string
}
export interface ForgotPassword {
  Email: string
}

export interface IPageList<T> {
  pager: IPager;
  objectList: Array<T>;
  totalSum: number,
  totalNet: number,
  totalVat: number
}
export interface IVehicleInfo {
  vehicleplate: string;
  vehicleManufacturer: string;
  vehicleModel: string;
  vehicleYear: number;
}

export interface IHtmlContent {
  content: string;
}
export interface IPager {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  firstPage: number;
  sortBy: string;
  sortDir: number;
}
export interface ISelect {
  value: string;
  text: string;
}
export type SverityType = "success" | "secondary" | "warn" | "help" | "info" | "danger" | "primary" | "contrast" | null | undefined;
export interface IEnum {
  key: string;
  value: string;
  default: boolean;
  text: string;
}

export interface IEnums {
  country: string,
  lang: string,
  key: string;
  value: string;
  index: number;
  isdefault: boolean;
  text: string;
  sverity: string;
}

export interface IEmail {
  country: string,
  lang: string,
  objectName: string,
  wmsId: string,
  workshopName: string,
  id: string,
  emailTo: string,
  subject: string,
  customMessage: string
}
export interface ITokenClaims {
  country: string,
  lang: string,
  wmsId: string,
  workshopName: string,
  objectName: string,
  id: string
}

export interface IPdf {
  country: string;
  lang: string;
  wmsId: string;
  objectName: string;
  ids: string;
  templateName: string;
}


export interface IWeeklyCalendar {
  cYear: string;
  cWeek: number;
  cTime: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  mondayDate: string;
  tuesdayDate: string;
  wednesdayDate: string;
  thursdayDate: string;
  fridayDate: string;
  saturdayDate: string;
  sundayDate: string;
  mondayBookings: IWorkOrder[];
  tuesdayBookings: IWorkOrder[];
  wednesdayBookings: IWorkOrder[];
  thursdayBookings: IWorkOrder[];
  fridayBookings: IWorkOrder[];
  saturdayBookings: IWorkOrder[];
  sundayBookings: IWorkOrder[];

}
export interface IDailyCalendar {
  cDate: string,
  cTime: string,
  workOrders: IWorkOrder[],
}


export interface IDigitalService {
  wmsId: string;
  digitalServiceId: number;
  userId: string;
  serviceType: string;
  creationDate: string;
  serviceDate: string;
  nextServiceDate: string;
  vin: string;
  vehiclePlate?: string | null;
  vehicleMileage?: number | null;
  vehicleManufacturer?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  invoiceId?: number | null;
  services: string;
  comments: string;
  workshopName: string;
  workshopAddress: string;
  workshopCity: string;
  telephone: string;
  email: string;
}
export interface ICustomer {
  wmsId: string;
  customerId: number;
  customerName: string;
  customerType: number;
  customerTag: number;
  organizationNo: string;
  vatId: string;
  invoiceCreditDays: number;
  careOf: string;
  customerAddress: string;
  customerPostNo: string;
  customerCity: string;
  customerCountry: string;
  isCreditAllowed: boolean;
  telephone: string;
  email: string;
  digitalServiceId: string;
  totalDue: number;
  totalPaid: number;
  totalOffers: number;
  totalAccepted: number;
  totalRejected: number;
  customerTypeName: number;
  customerTagName: number;
  isEdit: boolean;
}
export interface IEmployee {
  wmsId: string,
  employeeId: number,
  personnumber: string,
  fullName: string,
  friendlyName: string,
  jobTitle: string,
  hireDate: string,
  terminationDate: string,
  monthlySalary: number,
  calendarColor: string,
  street: string,
  postNo: string,
  city: string,
  country: string,
  telephone: string,
  email: string,
  skills: string,
  certifications: string,
  isActive: boolean
}
export interface ITimesheet {
  wmsId: string,
  timesheetId: number,
  employeeId: number,
  timesheetType: string,
  startDate: string,
  intervalId: number,
  timeIn:string,
  timeOut:string,
  isFullDay: boolean,
  isActive: boolean,
  comments: string,
  deleteComments: string,
  employee: IEmployee
}

export interface IFileUploadRequest {
  wmsId?: string;
  type: string; //allowed type = 'workorder'
  id: number;
  file: File;
}
export interface IFileUploadResponse {
  fileName: string;
  key: string;
  sizeInKb: string;
  lstModified: string;
}


export interface IInvoice {
  wmsId: string;
  invoiceId: number;
  customerId: number;
  customerName: string;
  customerEmail: string,
  digitalServiceId: string;
  invoiceDate: string;
  vehiclePlate: string;
  vehicleMileage: number;
  vehicleManufacturer: string;
  vehicleModel: string;
  vehicleYear: number;
  creditDays: number;
  dueDate: string;
  currency: string;
  yourRef: string;
  paymentType: string;
  paymentTypeLabel: string;
  paymentDate: string;
  price: number;
  vat: number;
  adjustment: number;
  priceIncVat: number;
  isSent: boolean;
  isPaid: boolean;
  totalPaid: number;
  remainingBalance: number;
  workshopName: string;
  priceMode: number;
  details: IInvoiceDetail[];
  payments: IInvoicePayment[];
  history: IInvoiceHistory[];
}
export interface IInvoiceDetail {
  wmsId: string;
  invoiceId: number;
  rowIndex: number;
  category: string;
  productId: number;
  product: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatPercentage: number;
  discountPercentage: number;
  price: number;
  vat: number;
  priceIncVat: number;
  textContent: string | null; //freetextfield
  isTextRow: boolean;
}



export interface IDetailTemplate {
  rowIndex: number;
  category: string;
  product: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatPercentage: number;
  discountPercentage: number;
  price: number;
  vat: number;
  priceIncVat: number;
  freeText: string | null; //freetextfield
  isTextRow: boolean;
}


export interface IInvoicePayment {
  wmsId: string;
  invoiceId: number;
  invoicePaymentId: number;
  paymentDate: string;
  paymentAmount: number;
  paymentNote: string;
}

export interface IInvoiceHistory {
  wmsId: string;
  invoiceId: number;
  createdOn: string;
  actionType: string;
  actionText: string;
}
export interface IOffer {
  wmsId: string;
  offerId: number;
  customerId: number;
  offerDate: string;
  vehiclePlate: string;
  vehicleMileage: number;
  vehicleManufacturer: string;
  vehicleModel: string;
  vehicleYear: number;
  validDays: number;
  validFrom: string;
  validTill: string;
  currency: string;
  yourRef: string;
  paymentType: string;
  price: number;
  vat: number;
  adjustment: number;
  priceIncVat: number;
  isSent: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  acceptRejectDate: string;
  offerType: string;
  //offerTypeItems: MenuItem[],

  selectedOfferType: string;
  customerName: string;
  customerEmail: string,
  workshopName: string;
  priceMode: number;
  details: IOfferDetail[];
  history: IOfferHistory[];
}
export interface IOfferDetail {
  wmsId: string;
  offerId: number;
  rowIndex: number;
  category: string;
  product: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatPercentage: number;
  discountPercentage: number;
  price: number;
  vat: number;
  priceIncVat: number;
  freeText: string | null; //freetextfield
  isTextRow: boolean;
}

export interface IOfferHistory {
  wmsId: string;
  offerId: number;
  createdOn: string;
  actionType: string;
  actionText: string;
}
export interface IProduct {
  wmsId: string;
  productId: number;
  category: string;
  productName: string;
  productDescription: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatPercentage: number;
  price: number;
  vat: number;
  priceIncVat: number;
  inHouseQuantity:number;
  inventoryQuantity:number;
}

export interface IInventory {
  wmsId: string;
  productId: number;
  inventoryId: number;
  inventoryDate: string;
  inventoryQuantity: number;
  inventoryNote: string;
}
export interface ISupplier {
  wmsId: string,
  supplierId: number,
  supplierName: string
}
export interface ISale {
  wmsId: string,
  saleYear: number,
  saleMonth: number,
  turnover: number
}
import { MenuItem } from "primeng/api"

export interface IWorkOrder {
  wmsId: string,
  workOrderId: number,
  customerId: number,
  customerName: string,
  customerTelephone: string,
  customerEmail: string,
  workOrderDate: string,
  vehiclePlate: string,
  vehicleMileage: number,
  vehicleManufacturer: string,
  vehicleModel: string,
  vehicleYear: number,
  paymentType: string,
  workOrderStatus: string,
  description: string,
  oilType: string,
  oilCapacity: number,
  offerId: number,
  employeeId: number,
  employeeName: string,
  bookingDate: string,
  bookingTime: string,
  purchaseCount: string,
  estimatedHours: string,
  serviceTypes: string,
  woPurchases: IWOPurchase[],
  woServices: IWOService[],
  isActive: number,
  // workOrderStatusItems: MenuItem[],
//deliveryDate: string,
  //deliveryTime: string,
}

export interface IWOPurchase {
  woPurchaseId:number,
  supplierName: string,
  purchaseReference: string,
  purchaseNote?: string
}
export interface IWOService {
  index: number;
  serviceName: string;
  serviceHours: number;
}

export interface IWorkshop {
  wmsId: string;
  workshopName: string;
  registrationId: string;
  vatId: string;
  workshopStreet: string;
  workshopPostNo: string;
  workshopCity: string;
  workshopCountry: string;
  telephone: string;
  email: string;
  bankgiro: string;
  swish: string;
  bic: string;
  iban: string;
  priceMode: number;
  isFskat: boolean;
}
// Dashboard

export interface ITopManufacturer {
  vehicleManufacturer:string;
  sale: string;
  orderCount: number;
}
export interface ITopSale {
  monthYear: string;
  partsSale: string;
  workSale: string;

}
export interface ITopCustomer {
  customerId: number;
  customerName: string;
  sale: string;
  orderCount: number;

}
// export interface ITopModel {
//   vehicleManufacturer: string;
//   vehicleModel: string;
//   visitCount: string;
// }

// export interface ITopDashboardItem {
//   type: string;
//   sum: string;
//   count: string;
// }
export interface ICustomerTag {
  wmsId: string;
  customerTagId: number;
  customerTagName: string;
  isDefault: boolean;
  customerCount: number;
}
export interface IProductTemplate {
  wmsId: string,
  productTemplateId: number,
  productTemplateName: string,
  details: IProductDetailTemplate[]
}
export interface IProductDetailTemplate {
  rowIndex: number;
  category: string;
  product: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatPercentage: number;
  discountPercentage: number;
  price: number;
  vat: number;
  priceIncVat: number;
  textContent: string | null; 
  isTextRow: boolean;
}

export interface ICustomerType {
  wmsId: string;
  customerTypeId: number;
  customerTypeName: string;
  isDefault: boolean;
  customerCount: number;
}
export interface IWorkShopService {
  wmsId?: string;
  serviceName: string;
  serviceHours: number;
  workshopServiceId?: number;
}

export interface IOutStandingBalance {
        priceIncVat:number;
        vat:number;
        orderCount:number;
}
export interface IUnpaidInvoice {
  customerId: number;
  customerName: string;
  invoiceCount: number;
  priceIncVat: number;
  vat: number;
}
export interface IMonthSummary {
  sale: number;
  orderCount: number;
}
export interface IWmsLog {
method:string;
controller:string;
action:string;
requestBody:string;
statusCode:number;
}

export interface IInvoicePromptRequest {
context?:string;
items: IInvoiceDetailPrompt[]
}
export interface IInvoiceDetailPrompt{
type:string;
name?:string;
description?:string;
quantity:number;
unit:string;
}

    