import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-description-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DescriptionEditorComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-2">
      <!-- Label -->
      <label class="block text-sm font-medium text-gray-700">
        {{ label }}
      </label>

      <!-- Toolbar -->
      <div class="flex items-center gap-2 p-2 bg-gray-100 border border-gray-300 rounded-t-lg">
        
        <!-- Botón Negrita -->
        <button type="button" 
                (click)="insertMarkdown('**')" 
                class="px-3 py-1.5 hover:bg-white rounded transition-colors text-sm font-semibold" 
                title="Negrita - selecciona texto y haz clic">
          <strong>B</strong>
        </button>
        
        <!-- Botón Subrayado -->
        <button type="button" 
                (click)="insertMarkdown('__')" 
                class="px-3 py-1.5 hover:bg-white rounded transition-colors text-sm" 
                title="Subrayado - selecciona texto y haz clic">
          <u>U</u>
        </button>
        
        <div class="w-px h-6 bg-gray-300"></div>
        
        <!-- Botón Lista/Checkbox -->
        <div class="relative">
          <button type="button" 
                  (click)="showBulletMenu = !showBulletMenu"
                  class="px-3 py-1.5 hover:bg-white rounded transition-colors text-sm flex items-center gap-1" 
                  title="Insertar viñeta o checkbox">
            <input *ngIf="selectedBulletType === 'checkbox'" 
                  type="checkbox" 
                  [checked]="selectedBullet === '[x]'"
                  disabled
                  class="w-3.5 h-3.5 pointer-events-none">
            <span *ngIf="selectedBulletType === 'bullet'" class="text-base">{{ selectedBullet }}</span>
            <span class="text-xs">Lista</span>
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <!-- Menú desplegable -->
          <div *ngIf="showBulletMenu" 
              (click)="$event.stopPropagation()"
              class="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[220px]">
            
            <div class="p-2 border-b border-gray-200">
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide px-2 py-1">Viñetas y Checkboxes</p>
            </div>
            
            <div class="p-2 space-y-1 max-h-60 overflow-y-auto">
              <button *ngFor="let bullet of bulletTypes"
                      type="button"
                      (click)="selectBullet(bullet.symbol, bullet.type)"
                      class="w-full text-left px-3 py-2 hover:bg-cyan-50 rounded transition-colors flex items-center gap-3"
                      [class.bg-cyan-100]="selectedBullet === bullet.symbol">
                
                <span *ngIf="bullet.type === 'checkbox'" class="w-6 flex items-center justify-center">
                  <input type="checkbox" 
                        [checked]="bullet.symbol === '[x]'"
                        disabled
                        class="w-4 h-4 pointer-events-none">
                </span>
                
                    <span *ngIf="bullet.type === 'bullet'" class="text-lg w-6 text-center">
                    {{ bullet.symbol }}
                    </span>
                    
                    <span class="text-sm text-gray-700 flex-1">{{ bullet.name }}</span>
                    
                    <svg *ngIf="selectedBullet === bullet.symbol" 
                        class="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Textarea -->
      <textarea
        #editor
        [(ngModel)]="content"
        (keydown)="onDescriptionKeyDown($event)"
        (keydown.tab)="onTab($event)"
        [rows]="rows"
        class="w-full p-4 border border-gray-300 rounded-b-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-white resize-y"
        style="direction: ltr; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;"
        [placeholder]="placeholder"
        [maxlength]="maxLength"
        (input)="onContentChange()"></textarea>
    </div>
  `
})
export class DescriptionEditorComponent implements ControlValueAccessor {
  @Input() label = 'Descripción';
  @Input() placeholder = 'Escribe aquí... Usa los botones de arriba para dar formato';
  @Input() rows = 3;
  @Input() maxLength = 50000;
  @Output() contentChange = new EventEmitter<string>();
  
  @ViewChild('editor') editor?: ElementRef<HTMLTextAreaElement>;

  content = '';
  showBulletMenu = false;
  selectedBullet = '•';
  selectedBulletType: 'bullet' | 'checkbox' = 'bullet';

  bulletTypes = [
    { symbol: '•', name: 'Punto', type: 'bullet' },
    { symbol: '■', name: 'Cuadrado', type: 'bullet' },
    { symbol: '→', name: 'Flecha', type: 'bullet' },
    { symbol: '[ ]', name: 'Checkbox sin marcar', type: 'checkbox' },
    { symbol: '[x]', name: 'Checkbox marcado', type: 'checkbox' }
  ] as const;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.content = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onContentChange(): void {
    this.onChange(this.content);
    this.contentChange.emit(this.content);
  }

  insertMarkdown(marker: string): void {
    const textarea = this.editor?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    if (selectedText) {
      this.content = before + marker + selectedText + marker + after;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marker.length, end + marker.length);
      }, 0);
    } else {
      this.content = before + marker + 'texto' + marker + after;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marker.length, start + marker.length + 5);
      }, 0);
    }

    this.onContentChange();
  }

  selectBullet(symbol: string, type: 'bullet' | 'checkbox' = 'bullet'): void {
    this.selectedBullet = symbol;
    this.selectedBulletType = type;
    this.showBulletMenu = false;
    this.insertList();
  }

  insertList(): void {
    const textarea = this.editor?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    const lastNewline = before.lastIndexOf('\n');
    const isStartOfLine = lastNewline === before.length - 1 || before === '';
    const needsNewline = isStartOfLine ? '' : '\n';

    if (selectedText) {
      const lines = selectedText.split('\n');
      const bulletedText = lines
        .filter(line => line.trim())
        .map(line => `${this.selectedBullet} ${line.trim()}`)
        .join('\n');

      this.content = before + needsNewline + bulletedText + after;

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + needsNewline.length + bulletedText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      this.content = before + needsNewline + this.selectedBullet + ' ' + after;

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + needsNewline.length + this.selectedBullet.length + 1;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }

    this.onContentChange();
  }

  onDescriptionKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const textarea = this.editor?.nativeElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(start);

      const lastLineStart = before.lastIndexOf('\n') + 1;
      const currentLine = before.substring(lastLineStart);

      const bulletMatch = currentLine.match(/^([•■→]) /);
      const checkboxMatch = currentLine.match(/^(\[ \]|\[x\]) /);

      if (bulletMatch) {
        const bullet = bulletMatch[1];

        if (currentLine.trim() === bullet) {
          event.preventDefault();
          this.content = before.substring(0, lastLineStart) + after;
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lastLineStart, lastLineStart);
          }, 0);
          this.onContentChange();
          return;
        }

        event.preventDefault();
        this.content = before + '\n' + bullet + ' ' + after;

        setTimeout(() => {
          textarea.focus();
          const newPosition = start + 1 + bullet.length + 1;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
        this.onContentChange();
      } else if (checkboxMatch) {
        const checkbox = checkboxMatch[1];

        if (currentLine.trim() === checkbox) {
          event.preventDefault();
          this.content = before.substring(0, lastLineStart) + after;

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lastLineStart, lastLineStart);
          }, 0);
          this.onContentChange();
          return;
        }

        event.preventDefault();
        this.content = before + '\n[ ] ' + after;

        setTimeout(() => {
          textarea.focus();
          const newPosition = start + 1 + 4;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
        this.onContentChange();
      }
    }
  }

  onTab(event: Event): void {
    event.preventDefault();
    const textarea = this.editor?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(start);

    this.content = before + '  ' + after;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);

    this.onContentChange();
  }

}