import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { catchError, filter, of, switchMap } from 'rxjs';
import { SHARED_IMPORTS } from '../../../sharedimports';
import { ICustomer, ICustomerTag, ICustomerType, IEnum, IPager, VehicleSearch, VehicleSearchResponse } from 'app/app.model';
import { SharedService, LogService } from 'app/services';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TreeTableModule } from 'primeng/treetable';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface TreeNode {
    data: { [key: string]: any }; // Contains the row data
    children?: TreeNode[]; // Optional child nodes
    parent?: TreeNode; // Optional parent node}
}


@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ...SHARED_IMPORTS, IconFieldModule, InputIconModule, TreeTableModule,ProgressSpinnerModule],
  templateUrl: './vehicle-list.component.html'
})

export class VehicleListComponent {

  vehiclePlates: VehicleSearch[] = [];
  vehicleInformation:string = '';
  vehicleColor: string = '';
  customers: ICustomer[] = [];
  vehiclesData: TreeNode[] = [];
  
  refreshedAt: string = '';
  
  partsSale: number = 0;
  labourSale: number = 0;
  totalTurnover: number = 0;
  suppliers: string[] = [];
  partsPercentage: number = 0;
  labourPercentage: number = 0;
  differencePercentage:number = 0;
  serviceType: string = '';
  mainDriver: string = '';
  
  typedStory: string = "";
  fullStory: string = "";
  typingSpeed = 20;

  isLoading: boolean = false;
  cols: any[] = [];
  expandedNodes: { [key: number]: boolean } = {};
  expandedChildNodes: { [key: string]: boolean } = {};
  constructor(
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly logger: LogService,
    public readonly sharedService: SharedService,
    private readonly route: ActivatedRoute) {



  }

  ngOnInit() {
    this.cols = [
      { field: 'label', header: '' },
      { field: 'customerId', header: this.sharedService.T('id') },
      { field: 'customerName', header: this.sharedService.T('customerName') },
      { field: 'invoiceId', header: this.sharedService.T('id') },
      { field: 'invoiceDate', header: this.sharedService.T('invoiceDate') },
      { field: 'dueDate', header: this.sharedService.T('dueDate') },
      { field: 'totalInvoiceAmount', header: this.sharedService.T('totalInvoiceAmount') },
      { field: 'labourAmount', header: this.sharedService.T('labourAmount') },
      { field: 'partsAmount', header: this.sharedService.T('partsAmount') },
      { field: 'paymentDate', header: this.sharedService.T('paymentDate') },
      { field: 'paymentAmount', header: this.sharedService.T('paymentAmount') },
      { field: 'remainingBalance', header: this.sharedService.T('remainingBalance') },
     
      { field: 'workOrderId', header: this.sharedService.T('id') },
      { field: 'bookingDate', header: this.sharedService.T('bookingDate') },
      { field: 'bookingTime', header: this.sharedService.T('bookingTime') },
      { field: 'employeeName', header: this.sharedService.T('employeeName') },
      { field: 'workOrderStatus', header: this.sharedService.T('status') },
      { field: 'supplierPurchaseDetails', header: this.sharedService.T('supplierPurchaseDetails') },
      
      
      { field: 'offerId', header: this.sharedService.T('id') },
      { field: 'offerDate', header: this.sharedService.T('offerDate') },
      { field: 'isAccepted', header: this.sharedService.T('isAccepted') },
      { field: 'digitalServiceId', header: this.sharedService.T('id') },
      { field: 'serviceDate', header: this.sharedService.T('serviceDate') },
      { field: 'serviceType', header: this.sharedService.T('serviceType') },
      { field: 'vehicleMileage', header: this.sharedService.T('vehicleMileage') }
    ];

  }




  formatTemplate(template: string, data: any): string {
  return template.replace(/{{(.*?)}}/g, (_, key) => data[key] ?? '');
}
getVehicleStory(key: string, data: any): string {
  const template = this.sharedService.T(key);
  return this.formatTemplate(template, data);
}

getVehicleStoryL1(): string {
  return this.getVehicleStory('vehicleStoryL1', {
    partsSale: this.partsSale,
    labourSale: this.labourSale,
    totalTurnover: this.totalTurnover
  });
}

getVehicleStoryL2(): string {
  return this.getVehicleStory('vehicleStoryL2', {
    suppliers: this.suppliers
  });
}

getVehicleStoryL3(): string {
  return this.getVehicleStory('vehicleStoryL3', {
    partsPercentage: this.partsPercentage,
    labourPercentage: this.labourPercentage
  });
}

getVehicleStoryL4(): string {
  return this.getVehicleStory('vehicleStoryL4', {
    serviceType: this.serviceType,
    mainDriver: this.mainDriver
  });
}

prepareStory() {

  this.fullStory =
    this.getVehicleStoryL1() + " " +
    this.getVehicleStoryL2() + " " +
    this.getVehicleStoryL3() + " " +
    this.getVehicleStoryL4();

  this.startTyping();
}
startTyping() {
  let index = 0;
  const interval = setInterval(() => {

    if (index < this.fullStory.length) {
      this.typedStory += this.fullStory.charAt(index);
      index++;
    }
    else {
      clearInterval(interval);
    }

  }, this.typingSpeed);

}
  keyupVehicle(event: any) {
    if (event?.value) {
      this.sharedService
      .getVehicleList(event.value)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        this.isLoading = false;
        if (response) {
          this.logger.info('Vehicle Info:');
          this.logger.info(response);
          this.vehiclePlates = response;
        }
      });
    }
  }
    onClearVehicle() {
      this.typedStory = ''
      this.vehiclePlates = [];
      this.vehiclesData = [];
      this.vehicleInformation = '';
      this.vehicleColor = '';
  }

  onSelectVehicle(event: any) {
    this.vehicleInformation = event.value.vehicleManufacturer + ' ' + event.value.vehicleModel + ' (' + event.value.vehicleYear + ')';
    this.logger.info('Selected vehicle plate: ' + this.vehicleInformation);
    this.logger.info('Selected vehicle plate: ' + event.value.vehiclePlate);
    this.loadvehicle(event.value.vehiclePlate);
    
  }

  setVehicleColor(invoices:any): void {
    const currentDate = new Date();
    // Check if any invoice is unpaid
    if(invoices && invoices.length > 0) {
    for (const invoice of invoices) {
      if (invoice.remainingBalance > 0) {
        // Check if due date is in the future
        const dueDate = new Date(invoice.dueDate);
        if (dueDate >= currentDate) {
          this.vehicleColor = 'yellow';
        } else {
          this.vehicleColor = 'red';
          return; 
        }
      }
    }
    }
  }
  loadvehicle(vehiclePlate: string)
  {
    this.isLoading = true;
    this.sharedService
      .getVehicleInfo(vehiclePlate)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        this.isLoading = false;
        if (response) {
// Assuming response is now an array of objects
const responseArray = response; // response is an array

// Iterate over the array and sum the values
responseArray.forEach((item: any) => {
  this.partsSale += item.partsSale || 0; // Add partsSale, default to 0 if undefined
  this.labourSale += item.labourSale || 0; // Add labourSale, default to 0 if undefined
  this.totalTurnover += item.totalInvoiceAmount || 0; // Add totalInvoiceAmount, default to 0 if undefined

  // Collect suppliers (avoid duplicates if necessary)
  if (Array.isArray(item.suppliers)) {
    this.suppliers = [...new Set([...this.suppliers, ...item.suppliers])]; // Merge and deduplicate suppliers
  }
  this.setVehicleColor(item.dataPayload.invoices);
});

// Calculate percentages and determine service type
if (this.totalTurnover > 0) {
  this.partsPercentage = Math.round((this.partsSale / this.totalTurnover) * 100);
  this.labourPercentage = Math.round((this.labourSale / this.totalTurnover) * 100);
  this.differencePercentage = Math.abs(this.labourPercentage - this.partsPercentage);
} else {
  this.partsPercentage = 0;
  this.labourPercentage = 0;
  this.differencePercentage = 0;
}

// Determine service type and main driver
if (this.labourPercentage >= 70) {
  this.serviceType = 'service-oriented';
  this.mainDriver = 'labour work';
} else if (this.partsPercentage >= 70) {
  this.serviceType = 'parts-oriented';
  this.mainDriver = 'parts replacement';
} else {
  this.serviceType = 'balanced';
  this.mainDriver = 'both labour and parts';
}

// Call prepareStory after calculations
this.prepareStory();

        this.logger.info('Response Received for vehicle info:');
        this.logger.info(response);
        const jsonDataArray = response; // Assuming this is an array of JSON objects
        this.vehiclesData = []; // Initialize an empty array
// Loop through each entry in the JSON data array
jsonDataArray.forEach((jsonData: any) => {
  this.refreshedAt = jsonData.refreshedAt; // Capture refreshedAt for potential use in the story or elsewhere
  const vehicleData = {
    data: {
      label: this.sharedService.T('customer'),
      customerId: jsonData.customerId,
      customerName: jsonData.customerName
    },
    children: [
      {
        data: { 
          label: 'invoices',
          totalInvoiceCount: jsonData.totalInvoiceCount || 0,
          totalInvoiceAmount: jsonData.totalInvoiceAmount || 0,
          paidInvoiceAmount: jsonData.paidInvoiceAmount || 0,
          unpaidInvoiceAmount: jsonData.unpaidInvoiceAmount || 0
        },
        children: Array.isArray(jsonData.dataPayload.invoices) ? jsonData.dataPayload.invoices.map((invoice: any) => ({
          data: {
            label: this.sharedService.T('invoice'),
            invoiceId: invoice.invoiceId,
            invoiceDate: this.getDateString(invoice.invoiceDate),
            dueDate: this.getDateString(invoice.dueDate),
            totalInvoiceAmount: invoice.totalInvoiceAmount,
            labourAmount: invoice.labourSale,
            partsAmount: invoice.partsSale,
            paymentDate: this.getDateString(invoice.paymentDate),
            paymentAmount: invoice.paymentAmount,
            remainingBalance: invoice.remainingBalance
          }
        })) : [] // Default to an empty array if invoices is null or not an array
      },
      {
        data: { 
          label: 'workorders',
          totalWorkOrderCount: jsonData.totalWorkOrderCount || 0,
          lastWorkOrderDate: this.getDateString(jsonData.lastWorkOrderDate),
          totalWOPurchaseCount: jsonData.totalWOPurchaseCount || 0
        },
        children: Array.isArray(jsonData.dataPayload.workOrders) ? jsonData.dataPayload.workOrders.map((workOrder: any) => ({
          data: {
            label: this.sharedService.T('workorder'),
            workOrderId: workOrder.workOrderId,
            bookingDate: this.getDateString(workOrder.bookingDate),
            bookingTime: workOrder.bookingTime,
            employeeName: workOrder.employeeName,                       
            workOrderStatus: workOrder.workOrderStatus,
            supplierPurchaseDetails: workOrder.supplierPurchaseDetails
          }
        })) : [] // Default to an empty array if workOrders is null or not an array
      },
      {
        data: { 
          label: 'offers',
          totalOfferCount: jsonData.totalOfferCount || 0
        },
        children: Array.isArray(jsonData.dataPayload.offers) ? jsonData.dataPayload.offers.map((offer: any) => ({
          data: {
            label: this.sharedService.T('offer'),
            offerId: offer.offerId,
            offerDate: this.getDateString(offer.offerDate),
            priceIncVat: offer.priceIncVat,
            isAccepted: offer.isAccepted
          }
        })) : [] // Default to an empty array if offers is null or not an array
      },
      {
        data: { 
          label: 'digitalServiceRecord',
          totalDigitalServiceCount: jsonData.totalDigitalServiceCount || 0,
          lastDigitalServiceDate: this.getDateString(jsonData.lastDigitalServiceDate)
        },
        children: Array.isArray(jsonData.dataPayload.digitalServices) ? jsonData.dataPayload.digitalServices.map((service: any) => ({
          data: {
            label: this.sharedService.T('digitalServiceRecord'),
            digitalServiceId: service.digitalServiceId,
            serviceDate: this.getDateString(service.serviceDate),
            serviceType: service.serviceType,
            vehicleMileage: service.vehicleMileage
          }
        })) : [] // Default to an empty array if digitalServices is null or not an array
      }
    ]
  };

  // Push the constructed vehicle data into the vehiclesData array
  this.vehiclesData.push(vehicleData);
});

        
        
        
        }
        console.log('Transformed Vehicles Data:', JSON.stringify(this.vehiclesData, null, 2));
      });
  }

  toggleNode(idx: number): void {
    this.expandedNodes[idx] = !this.expandedNodes[idx];
  }
  getDateString(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    let formattedDate = date.toISOString().split('T')[0];
    return formattedDate;
  }
  toggleChildNode(idx: number, cidx: number): void {
    const key = `${idx}-${cidx}`;
    this.expandedChildNodes[key] = !this.expandedChildNodes[key];
  }

  getRelevantColumns(rowData: any, level: string): any[] {
    if (level === 'customer') {
      // Customer level: show only customer-related columns
      return this.cols.filter(c => ['label', 'customerId', 'customerName'].includes(c.field));
    } else if (level === 'category') {
      // Category level: only show label
      return this.cols.filter(c => c.field === 'label');
    } else if (level === 'invoice') {
      // Invoice items: show invoice-related columns
      return this.cols.filter(c => ['label', 'invoiceId', 'invoiceDate', 'dueDate', 'totalInvoiceAmount', 'labourAmount', 'partsAmount', 'paymentDate', 'paymentAmount', 'remainingBalance'].includes(c.field));
    
    } else if (level === 'workorder') {
      // Work order items: show work order-related columns
      return this.cols.filter(c => ['label', 'workOrderId','bookingDate','bookingTime', 'workOrderDate','employeeName', 'workOrderStatus','supplierPurchaseDetails'].includes(c.field));
    } else if (level === 'offer') {
      // Offer items: show offer-related columns
      return this.cols.filter(c => ['label', 'offerId', 'offerDate', 'priceIncVat', 'isAccepted'].includes(c.field));
    } else if (level === 'service') {
      // Digital service items: show service-related columns
      return this.cols.filter(c => ['label', 'digitalServiceId', 'serviceDate', 'serviceType', 'vehicleMileage'].includes(c.field));
    }
    return this.cols;
  }
}