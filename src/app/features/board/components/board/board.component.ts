import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from, of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { Board, Column,Card } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { ColumnComponent } from '../column/column.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ColumnComponent, HeaderComponent, CdkDropList, CdkDrag, ReactiveFormsModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  board?: Board;
  dropListIds: string[] = [];
  private snapshotCols: Column[] = [];
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  projectId?: number;
  workspaceId?: number;
   columns: Column[] = [];
  selectedCard: Card | null = null;
  selectedColumnName: string = '';

  colModalOpen = false;
  editMode = false;
  editingColumn?: Column;
  colForm!: FormGroup;
  colorPalette = [
    'bg-teal-200','bg-blue-200','bg-amber-200','bg-lime-200','bg-rose-200',
    'bg-cyan-200','bg-purple-200','bg-orange-200','bg-emerald-200','bg-pink-200'
  ];

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
      this.projectId = +params['projectId'];
      this.workspaceId = +params['workspaceId'];
      
      console.log('Cargando tablero para proyecto:', this.projectId);
      this.route.queryParams.subscribe(params => {
        const projectName = params['projectName'];
        console.log('📋 Proyecto:', projectName);
      });
      this.loadBoard();
    });
  }

  private loadBoard() {
    if (!this.projectId) {
      console.error('No hay projectId');
      return;
    }

    console.log('Intentando cargar board para proyecto:', this.projectId);

    this.boardService.getBoard(this.projectId).subscribe({
      next: (data) => {
        console.log('Datos recibidos del board:', data);
        this.board = data;
        
        if (!this.board.columns || this.board.columns.length === 0) {
          console.log('Sin columnas, creando por defecto...');
          this.createDefaultColumns();
        } else {
          console.log('Board tiene columnas:', this.board.columns.length);
          this.board.columns
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .forEach((c, i) => (c.order = i + 1));
          this.dropListIds = this.board.columns.map(c => 'col-' + c.id);
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
  if (!this.board || !this.projectId) {
    console.error('No hay board o projectId');
    return;
  }

  console.log('🔧 Intentando crear columnas para proyecto:', this.projectId);
  
  if (!this.board.columns) {
    this.board.columns = [];
  }

  const defaultColumns = [
    { title: 'Backlog', color: 'bg-teal-200', position: 1 },
    { title: 'Por Hacer', color: 'bg-blue-200', position: 2 },
    { title: 'En Desarrollo', color: 'bg-amber-200', position: 3 },
    { title: 'Hecho', color: 'bg-lime-200', position: 4 }
  ];

  console.log('Creando columnas secuencialmente...');
  from(defaultColumns).pipe(
    concatMap((col, index) => 
      this.boardService.createColumn(this.projectId!, col.title, col.position).pipe(
        map(newCol => {
          newCol.color = col.color;
          this.boardService.saveColumnColor(newCol.id, col.color);
          console.log(`Columna "${col.title}" creada:`, newCol);
          return newCol;
        }),
        catchError(error => {
          console.warn(`Columna "${col.title}" no se creó:`, error.message || error);
          return of(null);
        })
      )
    )
  ).subscribe({
    complete: () => {
      console.log('Proceso de creación terminado, recargando...');
      

      setTimeout(() => {
        this.boardService.getBoard(this.projectId!).subscribe({
          next: (boardData) => {
            console.log(' Board recargado:', boardData);
            
            if (boardData.columns && boardData.columns.length > 0) {
              this.board!.columns = boardData.columns;
              this.dropListIds = this.board!.columns.map(x => 'col-' + x.id);
              
              // Aplicar colores
              this.board!.columns.forEach((col, index) => {
                const defaultColor = defaultColumns[index]?.color || 'bg-gray-200';
                if (!col.color || col.color === 'bg-gray-200') {
                  col.color = defaultColor;
                  this.boardService.saveColumnColor(col.id, col.color);
                }
              });
              
              this.cdr.detectChanges();
              console.log('Tablero listo con', this.board!.columns.length, 'columnas');
            } else {
              console.warn('No se encontraron columnas, puede que necesites recargar la página');
            }
          },
          error: (err) => {
            console.error('Error recargando:', err);
            alert('Las columnas se crearon. Por favor, recarga la página manualmente.');
          }
        });
      }, 1500);
    }
  });
}

  private defaultBoard(): Board {
    return {
      id: this.projectId || 1,
      nombre: `Tablero Proyecto ${this.projectId}`,
      columns: []
    };
  }

  dropColumn(event: CdkDragDrop<Column[]>) {
    if (!this.board?.columns) return;

    this.snapshotCols = this.board.columns.map(c => ({ ...c }));

    const arr = [...event.container.data];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);

    arr.forEach((c, i) => (c.order = i + 1));
    this.board.columns = arr;

    from(arr)
      .pipe(concatMap(c => this.boardService.updateColumnPosition(c.id, c.order!)))
      .subscribe({
        next: () => {},
        error: () => { this.board!.columns = this.snapshotCols; }
      });
  }

  trackByColId = (_: number, c: Column) => c.id;

  persistReorder() {}

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
      const nextPos = (this.board.columns?.length ?? 0) + 1;

      this.boardService.createColumn(this.board.id, nombre, nextPos)
        .subscribe({
          next: (newCol) => {
            newCol.color = color;
            this.boardService.saveColumnColor(newCol.id, color);
            
            this.board!.columns.push(newCol);
            this.dropListIds = this.board!.columns.map(x => 'col-' + x.id);
            this.closeAddColumn();
          },
          error: (e) => {
            if (e.message && e.message.includes('Ya existe una columna')) {
              alert(e.message);
            } else {
              alert(e?.error?.error ?? 'No se pudo crear la columna');
            }
          }
        });
    }
  }

  onDeleteColumn(col: Column) {
    if (!this.board) return;
    if (!confirm(`¿Eliminar la columna "${col.nombre}"?`)) return;

    this.boardService.deleteColumn(col.id).subscribe({
      next: () => {
        this.board!.columns = this.board!.columns
          .filter(c => c.id !== col.id)
          .map((c, i) => ({ ...c, order: i + 1 }));
        this.dropListIds = this.board!.columns.map(x => 'col-' + x.id);

        from(this.board!.columns)
          .pipe(concatMap(c => this.boardService.updateColumnPosition(c.id, c.order!)))
          .subscribe();
      },
      error: (e) => alert(e?.error?.error ?? 'No se pudo eliminar la columna')
    });
  }

  goBackToWorkspace(): void {
    if (this.workspaceId) {
      this.router.navigate(['/workspace', this.workspaceId]);
    } else {
      this.location.back();
    }
  }

  openEditColumn(column: Column) {
    this.editMode = true;
    this.editingColumn = column;
    this.colForm.reset({
      nombre: column.nombre,
      color: column.color || this.colorPalette[0]
    });
    this.colModalOpen = true;
  }

  closeAddColumn() { 
    this.colModalOpen = false;
    this.editMode = false;
    this.editingColumn = undefined;
  }

  onEditColumn(column: Column) {
    this.openEditColumn(column);
  }

  onDeleteColumnFromChild(column: Column) {
    this.onDeleteColumn(column);
  }
  
}