import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Column } from '../../../models/board.model';

@Component({
  selector: 'app-board-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Dashboard del Proyecto</h2>
      <p>Hola</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class BoardDashboardComponent implements OnInit {
  @Input() proyectoId!: number;
  @Input() columns: Column[] = [];

  totalColumns = 0;
  totalTasks = 0;
  highPriorityTasks = 0;
  completionPercentage = 0;

  ngOnInit() {
    console.log("Este es dashboard")
  }


}