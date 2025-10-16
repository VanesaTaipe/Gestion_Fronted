import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { Errors } from "./error.interface";

@Component({
  selector: "app-list-errors",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div 
      *ngIf="errorList.length > 0" 
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
      <mat-icon class="text-red-500 mt-0.5">error</mat-icon>
      <div class="flex-1">
        <p *ngFor="let error of errorList" class="text-sm">
          {{ error }}
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class ListErrorsComponent {
  errorList: string[] = [];

  @Input() set errors(errorList: Errors | null) {
    this.errorList = errorList
      ? Object.keys(errorList.errors || {}).map(
          (key) => `${key}: ${errorList.errors[key]}`,
        )
      : [];
  }
}