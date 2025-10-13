import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from, of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { Board, Card, Column } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { ColumnComponent } from '../column/column.component';
import { HeaderComponent } from '../header/header.component';
import { CardDetailModalComponent } from '../card/card-detail.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule, 
    ColumnComponent, 
    HeaderComponent,  
    ReactiveFormsModule,
    CardDetailModalComponent
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  board?: Board;
  columns: Column[] = []; 
  columnIds: string[] = []; 
  proyectoId: number = 0;
  
  selectedCard: Card | null = null;
  selectedColumnName: string = '';
  showCardDetail = false;

  colModalOpen = false;
  editMode = false;
  editingColumn?: Column;
  colForm!: FormGroup;
  colorPalette = [
    'bg-teal-200','bg-blue-200','bg-amber-200','bg-lime-200','bg-rose-200',
    'bg-cyan-200','bg-purple-200','bg-orange-200','bg-emerald-200','bg-pink-200'
  ];

  private location = inject(Location);
  private route = inject(ActivatedRoute);
  workspaceId?: number;

  constructor(
    private boardService: BoardService, 
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.colForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      color: [this.colorPalette[0], Validators.required],
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.proyectoId = +params['projectId']; 
      this.workspaceId = +params['workspaceId'];
      
      console.log('Cargando tablero para proyecto:', this.proyectoId);
      this.loadBoard();
    });
  }

  private loadBoard() {
    if (!this.proyectoId) {
      console.error('No hay projectId');
      return;
    }

    console.log('Intentando cargar board para proyecto:', this.proyectoId);

    this.boardService.getBoard(this.proyectoId).subscribe({
      next: (data) => {
        console.log('Datos recibidos del board:', data);
        this.board = data;
        
        if (!this.board.columns || this.board.columns.length === 0) {
          console.log('Sin columnas, creando por defecto...');
          this.createDefaultColumns();
        } else {
          console.log('Board tiene columnas:', this.board.columns.length);
          
          this.board.columns.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          this.columns = [...this.board.columns]; 
          this.columnIds = this.columns.map(c => 'col-' + c.id); 
        }
      },
      error: (e) => {
        console.error('Error completo:', e);
        if (e.status === 404) {
          console.log('Proyecto no existe, inicializando...');
          this.board = this.defaultBoard();
          this.createDefaultColumns();
        } else {
          alert('Error al cargar el tablero. Por favor, recarga la página.');
        }
      }
    });
  }

  private createDefaultColumns() {
    if (!this.board || !this.proyectoId) {
      console.error('No hay board o projectId');
      return;
    }

    console.log('Intentando crear columnas para proyecto:', this.proyectoId);
    
    if (!this.board.columns) {
      this.board.columns = [];
    }

    const defaultColumns = [
      { title: 'Backlog', color: 'bg-teal-200', position: 1 },
      { title: 'Por Hacer', color: 'bg-blue-200', position: 2 },
      { title: 'En Desarrollo', color: 'bg-amber-200', position: 3 },
      { title: 'Hecho', color: 'bg-lime-200', position: 4 }
    ];

    from(defaultColumns).pipe(
      concatMap((col) => 
        this.boardService.createColumn(this.proyectoId!, col.title, col.position).pipe(
          map(newCol => {
            newCol.color = col.color;
            this.boardService.saveColumnColor(newCol.id, col.color);
            return newCol;
          }),
          catchError(error => {
            console.warn(`Columna "${col.title}" no se creó:`, error);
            return of(null);
          })
        )
      )
    ).subscribe({
      complete: () => {
        setTimeout(() => {
          this.boardService.getBoard(this.proyectoId!).subscribe({
            next: (boardData) => {
              if (boardData.columns && boardData.columns.length > 0) {
                this.board!.columns = boardData.columns;
                this.columns = [...boardData.columns]; // ← Actualizar array local
                this.columnIds = this.columns.map(x => 'col-' + x.id);
                this.cdr.detectChanges();
              }
            },
            error: (err) => console.error('Error recargando:', err)
          });
        }, 1500);
      }
    });
  }

  private defaultBoard(): Board {
    return {
      id: this.proyectoId || 1,
      nombre: `Tablero Proyecto ${this.proyectoId}`,
      columns: []
    };
  }

  // Mover COLUMNAS
  dropColumn(event: CdkDragDrop<Column[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    
    // Actualizar el board también
    if (this.board) {
      this.board.columns = [...this.columns];
    }
    
    this.updateColumnPositions();
  }

updateColumnPositions() {
  const positions = this.columns.map((col, index) => ({
    id: col.id,
    position: index + 1
  }));
  
  this.boardService.updateColumnPositions(this.proyectoId!, positions).subscribe({
    next: () => console.log('Posiciones de columnas actualizadas'),
    error: (e) => console.error('Error actualizando posiciones de columnas:', e)
  });
}

  // TrackBy para columnas
  trackByColumnId = (_: number, column: Column) => column.id;

  // Cuando las tarjetas cambian
  onCardsChanged() {
    console.log('Tarjetas actualizadas');
  }

  // Modal de detalle de tarjeta
  closeCardDetail() {
    this.showCardDetail = false;
    this.selectedCard = null;
    this.selectedColumnName = '';
  }

  onCardUpdated(updatedCard: Card) {
    if (!this.columns) return;
    
    for (const col of this.columns) {
      const cardIndex = col.cards.findIndex(c => c.id === updatedCard.id);
      if (cardIndex !== -1) {
        col.cards[cardIndex] = { ...updatedCard };
        break;
      }
    }
  }

  onCardDeleted(cardId: number) {
    if (!this.columns) return;
    
    for (const col of this.columns) {
      const cardIndex = col.cards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        col.cards.splice(cardIndex, 1);
        break;
      }
    }
    
    this.closeCardDetail();
  }

  // Gestión de columnas
  openAddColumn() {
    this.editMode = false;
    this.editingColumn = undefined;
    this.colForm.reset({ 
      nombre: '', 
      color: this.colorPalette[0] 
    });
    this.colModalOpen = true;
  }

  submitAddColumn() {
    if (!this.board) return;
    if (this.colForm.invalid) { 
      this.colForm.markAllAsTouched(); 
      return; 
    }

    const nombre = (this.colForm.value.nombre as string).trim();
    const color = this.colForm.value.color as string;

    if (this.editMode && this.editingColumn) {
      // Modo edición
      this.boardService.updateColumn(this.editingColumn.id, { nombre })
        .subscribe({
          next: () => {
            this.editingColumn!.nombre = nombre;
            this.editingColumn!.color = color;
            this.boardService.saveColumnColor(this.editingColumn!.id, color);
            this.closeAddColumn();
          },
          error: (e) => {
            alert(e?.error?.error ?? 'No se pudo actualizar la columna');
          }
        });
    } else {
      // Modo creación
      const nextPos = (this.columns?.length ?? 0) + 1;

      this.boardService.createColumn(this.board.id, nombre, nextPos)
        .subscribe({
          next: (newCol) => {
            newCol.color = color;
            this.boardService.saveColumnColor(newCol.id, color);
            
            this.columns.push(newCol);
            this.board!.columns = [...this.columns];
            this.columnIds = this.columns.map(x => 'col-' + x.id);
            this.closeAddColumn();
          },
          error: (e) => {
            alert(e?.error?.error ?? 'No se pudo crear la columna');
          }
        });
    }
  }

  onEditColumn(column: Column) {
    this.editMode = true;
    this.editingColumn = column;
    this.colForm.reset({
      nombre: column.nombre,
      color: column.color || this.colorPalette[0]
    });
    this.colModalOpen = true;
  }

  onDeleteColumn(col: Column) {
    if (!this.board) return;
   
    if (this.columns.length <= 1) {
      alert('No se puede eliminar la última columna del tablero');
      return;
    }
    
    if (!confirm(`¿Eliminar la columna "${col.nombre}"?`)) return;

    this.boardService.deleteColumn(col.id).subscribe({
      next: () => {
        this.columns = this.columns.filter(c => c.id !== col.id);
        this.board!.columns = [...this.columns];
        this.columnIds = this.columns.map(x => 'col-' + x.id);
      },
      error: (e) => alert(e?.error?.error ?? 'No se pudo eliminar la columna')
    });
  }

  closeAddColumn() { 
    this.colModalOpen = false;
    this.editMode = false;
    this.editingColumn = undefined;
  }

  goBackToWorkspace(): void {
    if (this.workspaceId) {
      this.router.navigate(['/workspace', this.workspaceId]);
    } else {
      this.location.back();
    }
  }
}