import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnComponent } from '../column/column.component';
import { HeaderComponent } from '../header/header.component';
import { BoardService } from '../../services/board.service';
import { Board } from '../../models/board.model';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ColumnComponent, HeaderComponent, CdkDropListGroup],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  board?: Board;
  /** IDs de listas para conectar columnas: ['col-<id1>', 'col-<id2>', ...] */
  dropListIds: string[] = [];

  constructor(private boardService: BoardService) {
    this.boardService.getBoard().subscribe((data) => {
      this.board = data;
      this.dropListIds = (this.board?.columns ?? []).map((c) => 'col-' + c.id);
    });
  }

  /** persistir al backend el nuevo orden */
  persistReorder() {
    // this.boardService.saveBoard(this.board!).subscribe();
    console.log('Nuevo estado del board:', this.board);
  }
}

