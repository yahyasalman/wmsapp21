import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-generic-loader',
  standalone: true,
  imports: [],
  templateUrl: './generic-loader.component.html',
    styleUrls: ['./generic-loader.component.css'] 
})
export class GenericLoaderComponent {
  @Input('isLoading') isLoading: boolean = false;

}
