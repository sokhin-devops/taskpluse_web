import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Observable, finalize } from 'rxjs';

import { Task, TaskRequest, toDate, toDateString } from '../core/task.model';
import { TaskService } from '../core/task.service';

interface ApiErrorBody {
  message?: string;
  fieldErrors?: Record<string, string> | null;
}

/** Rejects a title made only of whitespace, reusing the `required` error key. */
function notBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { required: true }
    : null;
}

@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() task: Task | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    title: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200), notBlank]
    }),
    description: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.maxLength(5000)]
    }),
    dueDate: this.fb.control<Date | null>(null)
  });

  saving = false;

  get titleControl(): AbstractControl<string, string> {
    return this.form.controls.title;
  }

  get editing(): boolean {
    return this.task !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      return;
    }
    if (changes['visible'] || changes['task']) {
      this.syncFormFromTask();
    }
  }

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
  }

  onCancel(): void {
    this.close();
  }

  onSubmit(): void {
    if (this.saving) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const description = raw.description.trim();
    const request: TaskRequest = {
      title: raw.title.trim(),
      description: description.length > 0 ? description : null,
      dueDate: raw.dueDate ? toDateString(raw.dueDate) : null
    };

    const current = this.task;
    const save$: Observable<Task> = current
      ? this.taskService.update(current.id, request)
      : this.taskService.create(request);

    this.saving = true;
    save$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.saving = false))
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: current ? 'Task updated' : 'Task created',
            detail: request.title,
            life: 3000
          });
          this.saved.emit();
          this.close();
        },
        error: (error: unknown) => {
          this.messageService.add({
            severity: 'error',
            summary: current ? 'Could not update task' : 'Could not create task',
            detail: this.toErrorDetail(error),
            life: 5000
          });
        }
      });
  }

  private syncFormFromTask(): void {
    const task = this.task;
    this.form.reset({
      title: task ? task.title : '',
      description: task && task.description ? task.description : '',
      dueDate: task && task.dueDate ? toDate(task.dueDate) : null
    });
  }

  private close(): void {
    this.visibleChange.emit(false);
  }

  private toErrorDetail(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiErrorBody | string | null;
      if (body && typeof body === 'object') {
        const fieldErrors = body.fieldErrors;
        if (fieldErrors) {
          const messages = Object.values(fieldErrors);
          if (messages.length > 0) {
            return messages.join(' ');
          }
        }
        if (body.message) {
          return body.message;
        }
      }
      if (error.status === 0) {
        return 'Cannot reach the server. Check that the API is running.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
