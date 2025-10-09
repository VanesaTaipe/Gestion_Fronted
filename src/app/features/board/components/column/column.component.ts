import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Column, Card } from '../../models/board.model';
import { TaskService } from '../../services/task.service';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CdkDropList, CdkDrag, CardComponent],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css']
})
export class ColumnComponent {
  @Input() column!: Column;
  @Input() proyectoId!: number;
  @Input() connectedDropLists: string[] = [];
  
  @Output() cardsChanged = new EventEmitter<void>();
  @Output() editColumn = new EventEmitter<Column>();
  @Output() deleteColumn = new EventEmitter<Column>();

  showModal = false;
  menuOpen = false;
  creating = false;
  form!: FormGroup;

  //  Para archivos Y URLs
  selectedFiles: File[] = [];
  imageUrls: string[] = [];
  imageUrlInput = '';
  previewUrls: string[] = [];

  constructor(
    private fb: FormBuilder,
    private taskSvc: TaskService
  ) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descripcion: [''],
      assignee: [''],
      fecha_vencimiento: [''],
      prioridad: ['', Validators.required]
    });
  }

  // ===== Menú de tres puntos =====
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative') || target.closest('button')) {
      if (!target.closest('.absolute')) {
        this.menuOpen = false;
      }
    }
  }

  editColumnAction() {
    this.menuOpen = false;
    this.editColumn.emit(this.column);
  }

  deleteColumnAction() {
    this.menuOpen = false;
    this.deleteColumn.emit(this.column);
  }

  // Total de imágenes (archivos + URLs)
  getTotalImages(): number {
    return this.selectedFiles.length + this.imageUrls.length;
  }

  // Agregar URL de imagen
  addImageUrl() {
    const url = this.imageUrlInput.trim();
    if (url && this.getTotalImages() < 3) {
      // Validar que sea una URL válida
      try {
        new URL(url);
        this.imageUrls.push(url);
        this.previewUrls.push(url);
        this.imageUrlInput = '';
      } catch {
        alert('Por favor ingresa una URL válida');
      }
    }
  }

  // Manejar selección de archivos
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Limitar a 3 imágenes totales
      const availableSlots = 3 - this.getTotalImages();
      const filesToAdd = files.slice(0, availableSlots);
      
      filesToAdd.forEach(file => {
        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} no es una imagen válida`);
          return;
        }
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} es muy grande (máximo 5MB)`);
          return;
        }
        
        this.selectedFiles.push(file);
        
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
      
      // Limpiar el input
      input.value = '';
    }
  }

  // Eliminar imagen 
  removeImage(index: number) {
    // Determinar si es archivo o URL
    if (index < this.selectedFiles.length) {
      // Es un archivo
      this.selectedFiles.splice(index, 1);
    } else {
      // Es una URL
      const urlIndex = index - this.selectedFiles.length;
      this.imageUrls.splice(urlIndex, 1);
    }
    this.previewUrls.splice(index, 1);
  }

  // ===== Drag & Drop de tarjetas =====
  drop(event: CdkDragDrop<Card[]>) {
    const mismaLista = event.previousContainer === event.container;

    if (mismaLista) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      const items = event.container.data.map((c, i) => ({ id: c.id, position: i + 1 }));
      this.taskSvc.reorderCard(this.column.id, items).subscribe({
        next: () => this.cardsChanged.emit(),
        error: (e) => console.error('No se pudo reordenar', e),
      });
    } else {
      const previo = event.previousContainer.data;
      const actual = event.container.data;

      transferArrayItem(previo, actual, event.previousIndex, event.currentIndex);

      const movido = actual[event.currentIndex];
      const posicionNueva = event.currentIndex + 1;
      const columnaDestino = this.column.id;

      this.taskSvc.moveCard(movido.id, columnaDestino, posicionNueva).subscribe({
        next: () => {
          const actualItems = actual.map((c, i) => ({ id: c.id, position: i + 1 }));
          this.taskSvc.reorderCard(columnaDestino, actualItems).subscribe();

          const prevItems = previo.map((c, i) => ({ id: c.id, position: i + 1 }));
          if (prevItems.length) {
            const prevColIdAttr = (event.previousContainer.id || '').replace('col-', '');
            const prevColId = Number(prevColIdAttr) || prevColIdAttr || this.column.id;
            this.taskSvc.reorderCard(prevColId, prevItems).subscribe();
          }

          this.cardsChanged.emit();
        },
        error: (e) => {
          console.error('No se pudo mover:', e);
          transferArrayItem(actual, previo, event.currentIndex, event.previousIndex);
        },
      });
    }
  }

  trackById = (_: number, card: Card) => card.id;

  // ===== Modal de crear tarea =====
  AbrirTarea() {
    this.form.reset({
      titulo: '',
      descripcion: '',
      assignee: '',
      fecha_vencimiento: '',
      prioridad: ''
    });
    this.selectedFiles = [];
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.previewUrls = [];
    this.showModal = true;
  }

  cerrarTarea() {
    this.showModal = false;
    this.creating = false;
    this.selectedFiles = [];
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.previewUrls = [];
  }

  crearTareaBD() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      if (!this.form.value.prioridad) {
        const prioridadControl = this.form.get('prioridad');
        prioridadControl?.markAsTouched();
      }
      return;
    }

    this.creating = true;
    const titulo = (this.form.value.titulo as string).trim();
    const descripcion = (this.form.value.descripcion as string)?.trim() || '';
    const assignee = (this.form.value.assignee as string)?.trim() || '';
    const fecha = this.form.value.fecha_vencimiento || null;
    const prioridad = this.form.value.prioridad;

    if (!prioridad) {
      alert('Por favor selecciona una prioridad');
      this.creating = false;
      return;
    }

    console.log('Creando tarea con:', { 
      titulo, 
      descripcion, 
      prioridad, 
      fecha,
      archivos: this.selectedFiles.length,
      urls: this.imageUrls.length
    });

    let idAsignado: number | undefined;
    if (assignee && !isNaN(Number(assignee))) {
      idAsignado = Number(assignee);
    }

    this.taskSvc.createCard({
      id_proyecto: this.proyectoId,
      id_columna: this.column.id,
      titulo: titulo,
      descripcion: descripcion,
      due_at: fecha,
      prioridad: prioridad,
      id_asignado: idAsignado,
      id_creador: 1,
      position: 0,
      images: this.selectedFiles,
      imageUrls: this.imageUrls 
    }).subscribe({
      next: (newCard) => {
        console.log('Tarea creada exitosamente:', newCard);
        
        const cardForDisplay = {
          ...newCard,
          title: newCard.titulo,
          asignado_a: assignee,
          fecha_vencimiento: fecha,
          images: [...this.previewUrls] // Mostrar previews
        };
        
        this.column.cards.push(cardForDisplay);
        this.cardsChanged.emit();
        this.cerrarTarea();
      },
      error: (e) => {
        console.error('Error al crear tarjeta:', e);
        
        let errorMsg = 'No se pudo crear la tarjeta';
        
        if (e.error?.error) {
          errorMsg = e.error.error;
        } else if (e.status === 400) {
          errorMsg = 'Error en los datos enviados. Verifica que todos los campos obligatorios estén completos.';
        } else if (e.status === 422) {
          errorMsg = 'Ya existe una tarea con este nombre en la misma columna.';
        }
        
        alert(`Error: ${errorMsg}`);
        this.creating = false;
      }
    });
  }
}