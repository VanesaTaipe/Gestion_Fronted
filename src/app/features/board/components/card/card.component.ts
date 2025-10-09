import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Card } from '../../models/board.model';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {
  @Input() card!: Card;

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = months[date.getMonth()];
      return `${day} ${month}`;
    } catch {
      return dateStr;
    }
  }
}