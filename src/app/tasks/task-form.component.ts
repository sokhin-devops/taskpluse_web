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
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Observable, finalize } from 'rxjs';

import { toErrorMessage } from '../core/api-error';
import { Tag } from '../core/tag.model';
import { TagService } from '../core/tag.service';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  Task,
  TaskPriority,
  TaskRequest,
  TaskStatus,
  priorityIcon,
  toDate,
  toDateString
} from '../core/task.model';
import { TaskService } from '../core/task.service';

/** An option in the status or priority picker. */
interface Choice<T> {
  label: string;
  value: T;
  icon?: string;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done'
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

/** Rejects a title made only of whitespace, reusing the `required` error key. */
function notBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { required: true }
    : null;
}

/**
 * Create/edit dialog for a task.
 *
 * <p>The same dialog serves both: `task` being null means create. Fields are always sent
 * explicitly rather than omitted, because this form shows the user every value it is
 * about to write — leaving one out would save something different from what is on screen.</p>
 */
@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() task: Task | null = null;

  /** Column a task created from the board should land in. Ignored when editing. */
  @Input() defaultStatus: TaskStatus = 'TODO';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Task>();

  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly tagService = inject(TagService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  /** The account's tags, kept in step by TagService. */
  readonly tags = this.tagService.tags;

  readonly statusChoices: Choice<TaskStatus>[] = TASK_STATUSES.map((status) => ({
    label: STATUS_LABELS[status],
    value: status
  }));

  readonly priorityChoices: Choice<TaskPriority>[] = TASK_PRIORITIES.map((priority) => ({
    label: PRIORITY_LABELS[priority],
    value: priority,
    icon: priorityIcon(priority)
  }));

  readonly form = this.fb.group({
    title: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200), notBlank]
    }),
    description: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.maxLength(5000)]
    }),
    dueDate: this.fb.control<Date | null>(null),
    status: this.fb.control<TaskStatus>('TODO', { nonNullable: true }),
    priority: this.fb.control<TaskPriority>('MEDIUM', { nonNullable: true }),
    tagIds: this.fb.control<number[]>([], { nonNullable: true })
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
      dueDate: toDateString(raw.dueDate),
      status: raw.status,
      priority: raw.priority,
      tagIds: raw.tagIds
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
        next: (result) => {
          this.messageService.add({
            severity: 'success',
            summary: current ? 'Task updated' : 'Task created',
            detail: result.title,
            life: 3000
          });
          this.saved.emit(result);
          this.close();
        },
        error: (error: unknown) => {
          this.messageService.add({
            severity: 'error',
            summary: current ? 'Could not update task' : 'Could not create task',
            detail: toErrorMessage(error),
            life: 5000
          });
        }
      });
  }

  private syncFormFromTask(): void {
    const task = this.task;
    this.form.reset({
      title: task ? task.title : '',
      description: task?.description ?? '',
      dueDate: task ? toDate(task.dueDate) : null,
      status: task ? task.status : this.defaultStatus,
      priority: task ? task.priority : 'MEDIUM',
      tagIds: task ? task.tags.map((tag: Tag) => tag.id) : []
    });
  }

  private close(): void {
    this.visibleChange.emit(false);
  }
}
