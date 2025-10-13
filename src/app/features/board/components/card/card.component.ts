import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Card } from '../../models/board.model';
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: `./card.component.html`,
  styles: [`
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class CardComponent {
  @Input() card!: Card;
  @Output() cardClicked = new EventEmitter<Card>();
  @Output() deleteCard = new EventEmitter<Card>();
  formatDateShort(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthShort = months[date.getMonth()];
      return `${day} ${monthShort}`;
    } catch {
      return dateStr;
    }
  }

  getUserInitial(): string {
    const name = this.card.asignado_a || 'U';
    return name.charAt(0).toUpperCase();
  }

  getDescriptionPreview(): string {
    if (!this.card.descripcion) return '';
    const plainText = this.card.descripcion
      .replace(/[#*_\[\]]/g, '')
      .replace(/- \[[ x]\]/g, '')
      .split('\n')
      .filter(line => line.trim().length > 0)[0] || '';
    
    return plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
  }

  onCardClick(event: Event) {
    event.stopPropagation();
    this.cardClicked.emit(this.card);
  }
  onDelete(event: Event) {
    event.stopPropagation();
    if (confirm(`¿Eliminar la tarjeta "${this.card.title}"?`)) {
      this.deleteCard.emit(this.card);
    }
  }
}