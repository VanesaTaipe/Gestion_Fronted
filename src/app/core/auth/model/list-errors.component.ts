import { Component, Input } from "@angular/core";
import { Errors } from "./error.interface";

@Component({
  selector: "app-list-errors",
  templateUrl: "./list-error.component.html",
})
export class ListErrorsComponent {
  errorList: string[] = [];

  @Input() set errors(errorList: Errors | null) {
    this.errorList = errorList
      ? Object.keys(errorList.errors || {}).map(
          (key) => `${key} ${errorList.errors[key]}`,
        )
      : [];
  }
}
