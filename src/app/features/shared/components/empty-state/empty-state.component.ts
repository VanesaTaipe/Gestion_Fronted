import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state" [class]="containerClass">
      <div class="empty-icon" *ngIf="icon">
        <mat-icon [style.color]="iconColor">{{ icon }}</mat-icon>
      </div>
      
      <div class="empty-illustration" *ngIf="illustration">
        <img [src]="illustration" [alt]="title" class="illustration-image">
      </div>
      
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message" *ngIf="message">{{ message }}</p>
      
      <div class="empty-actions" *ngIf="showActions">
        <button 
          *ngIf="primaryActionText"
          mat-raised-button 
          [color]="primaryActionColor"
          (click)="onPrimaryAction()"
          [disabled]="primaryActionDisabled">
          <mat-icon *ngIf="primaryActionIcon">{{ primaryActionIcon }}</mat-icon>
          {{ primaryActionText }}
        </button>
        
        <button 
          *ngIf="secondaryActionText"
          mat-stroked-button
          [color]="secondaryActionColor"
          (click)="onSecondaryAction()"
          [disabled]="secondaryActionDisabled">
          <mat-icon *ngIf="secondaryActionIcon">{{ secondaryActionIcon }}</mat-icon>
          {{ secondaryActionText }}
        </button>
      </div>

      <div class="empty-footer" *ngIf="footerText">
        <p class="footer-text">{{ footerText }}</p>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
      color: #6c757d;
      min-height: 300px;
    }

    .empty-state.compact {
      padding: 2rem 1rem;
      min-height: 200px;
    }

    .empty-state.large {
      padding: 6rem 2rem;
      min-height: 400px;
    }

    .empty-icon {
      margin-bottom: 2rem;
    }

    .empty-icon mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      opacity: 0.5;
    }

    .empty-illustration {
      margin-bottom: 2rem;
    }

    .illustration-image {
      max-width: 200px;
      max-height: 150px;
      opacity: 0.7;
    }

    .empty-title {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .empty-state.compact .empty-title {
      font-size: 1.25rem;
    }

    .empty-state.large .empty-title {
      font-size: 1.75rem;
    }

    .empty-message {
      margin: 0 0 2rem 0;
      max-width: 400px;
      line-height: 1.6;
      color: #6c757d;
    }

    .empty-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 200px;
    }

    .empty-actions button {
      min-width: 180px;
    }

    .empty-footer {
      margin-top: 2rem;
    }

    .footer-text {
      margin: 0;
      font-size: 0.875rem;
      color: #adb5bd;
      font-style: italic;
    }

    /* Responsive */
    @media (min-width: 768px) {
      .empty-actions {
        flex-direction: row;
        justify-content: center;
      }
    }

    /* Animations */
    .empty-state {
      animation: fadeInUp 0.4s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input() iconColor: string = '#adb5bd';
  @Input() illustration: string = '';
  @Input() title: string = 'No hay elementos';
  @Input() message: string = '';
  @Input() footerText: string = '';
  
  // Primary action
  @Input() primaryActionText: string = '';
  @Input() primaryActionIcon: string = 'add';
  @Input() primaryActionColor: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() primaryActionDisabled: boolean = false;
  
  // Secondary action
  @Input() secondaryActionText: string = '';
  @Input() secondaryActionIcon: string = '';
  @Input() secondaryActionColor: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() secondaryActionDisabled: boolean = false;
  
  // Layout
  @Input() containerClass: string = '';
  @Input() showActions: boolean = true;

  @Output() primaryAction = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();

  onPrimaryAction(): void {
    this.primaryAction.emit();
  }

  onSecondaryAction(): void {
    this.secondaryAction.emit();
  }
}