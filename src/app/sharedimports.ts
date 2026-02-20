import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TabsModule } from 'primeng/tabs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
//import { DropdownModule } from 'primeng/dropdown';
//import { CalendarModule } from 'primeng/calendar';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IftaLabelModule } from 'primeng/iftalabel';

// Add ALL the PrimeNG modules you need
import { ChipModule } from 'primeng/chip';
import { SplitButtonModule } from 'primeng/splitbutton';
import { DataViewModule } from 'primeng/dataview';
import { AccordionModule } from 'primeng/accordion';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { TextareaModule } from 'primeng/textarea';
import { ListboxModule } from 'primeng/listbox';
import { CheckboxModule } from 'primeng/checkbox';
import { SharedModule } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ImageModule } from 'primeng/image';
import { PopoverModule } from 'primeng/popover';
import { ChartModule } from 'primeng/chart';
import { MenuModule } from 'primeng/menu';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
// import { SplitButtonModule } from 'primeng/splitbutton'; // ← ADD THIS (if missing)

export const SHARED_IMPORTS = [
  // Angular Modules
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  // PrimeNG Modules
  TableModule,
  ButtonModule,
  PaginatorModule,
  InputTextModule,
  SelectModule,
  AutoCompleteModule,
  TabsModule,
  ConfirmDialogModule,
  ToastModule,
  MessageModule,
  //DropdownModule,
  //CalendarModule,
  PanelModule,
  DialogModule,
  TooltipModule,
  DatePickerModule,
  ToggleButtonModule,
  InputNumberModule,
  AvatarModule,
  TagModule,
  BadgeModule,
  MultiSelectModule,
  FloatLabelModule,
  IftaLabelModule,
  
  // All other PrimeNG modules
  ChipModule,
  SplitButtonModule, // ← ADD THIS
  DataViewModule,
  AccordionModule,
  OverlayBadgeModule,
  TextareaModule,
  ListboxModule,
  CheckboxModule,
  SharedModule,
  FileUploadModule,
  CardModule,
  InputGroupModule,
  InputGroupAddonModule,
  ImageModule,
  PopoverModule,
  ChartModule,
  MenuModule,
  RadioButtonModule, // ← ADD THIS
  // ProgressSpinnerModule // ← ADD THIS
  SelectButtonModule,
];
