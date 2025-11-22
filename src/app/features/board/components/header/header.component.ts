import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() title: string = 'Nombre de Tablero';
  @Input() showNewColumn: boolean = true;
  @Output() newColumn = new EventEmitter<void>();
  @Output() backClicked = new EventEmitter<void>();

  goBack(): void {
    this.backClicked.emit();
  }
}
