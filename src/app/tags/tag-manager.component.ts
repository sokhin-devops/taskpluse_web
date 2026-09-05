import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, finalize } from 'rxjs';

import {
  AmbientBadgeComponent,
  AmbientDialogComponent,
  AmbientEmptyStateComponent,
  AmbientFormFieldComponent,
  AmbientInputDirective,
  AmbientPageComponent,
  AmbientPageHeaderComponent,
  AmbientTableComponent
} from '../ambient/ambient';
import { toErrorMessage } from '../core/api-error';
import { DEFAULT_TAG_COLOR, TAG_COLOR_CHOICES, Tag, readableTextOn } from '../core/tag.model';
import { TagService } from '../core/tag.service';

/**
 * Tag management: list, create, rename, recolour, delete.
 *
 * <p>Deleting a tag takes it off every task that carried it but leaves the tasks
 * themselves alone, so the confirmation says how many tasks are about to change — the one
 * consequence that is not obvious from the button.</p>
 */
@Component({
  selector: 'app-tag-manager',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    InputTextModule,
    SkeletonModule,
    TableModule,
    ToastModule,
    TooltipModule,
    AmbientBadgeComponent,
    AmbientDialogComponent,
    AmbientEmptyStateComponent,
    AmbientFormFieldComponent,
    AmbientInputDirective,
    AmbientPageComponent,
    AmbientPageHeaderComponent,
    AmbientTableComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tag-manager.component.html',
  styleUrl: './tag-manager.component.scss'
})
export class TagManagerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tagService = inject(TagService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tags = this.tagService.tags;
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);

  readonly colorChoices = TAG_COLOR_CHOICES;
  readonly skeletonRows: number[] = [0, 1, 2, 3];

  readonly summary = computed(() => {
    if (this.loading()) {
      return 'Loading your tags...';
    }
    const count = this.tags().length;
    if (count === 0) {
      return 'No tags yet.';
    }
    return count === 1 ? '1 tag.' : `${count} tags.`;
  });

  /** Null while creating, the tag being edited otherwise. */
  readonly editing = signal<Tag | null>(null);
  dialogVisible = false;

  readonly form = this.fb.group({
    name: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(40)]
    }),
    color: this.fb.control(DEFAULT_TAG_COLOR, { nonNullable: true })
  });

  private readonly busyIds = signal<ReadonlySet<number>>(new Set<number>());

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.tagService
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadFailed.set(true);
          this.messageService.add({
            severity: 'error',
            summary: 'Could not load tags',
            detail: toErrorMessage(error, 'The TaskPulse API did not respond. Please try again.'),
            life: 5000
          });
        }
      });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: '', color: DEFAULT_TAG_COLOR });
    this.dialogVisible = true;
  }

  openEdit(tag: Tag): void {
    this.editing.set(tag);
    this.form.reset({ name: tag.name, color: tag.color });
    this.dialogVisible = true;
  }

  onCancel(): void {
    this.dialogVisible = false;
  }

  pickColor(color: string): void {
    this.form.controls.color.setValue(color);
  }

  onSubmit(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, color } = this.form.getRawValue();
    const current = this.editing();
    const request = { name: name.trim(), color };

    const save$: Observable<Tag> = current
      ? this.tagService.update(current.id, request)
      : this.tagService.create(request);

    this.saving.set(true);
    save$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (saved) => {
          this.messageService.add({
            severity: 'success',
            summary: current ? 'Tag updated' : 'Tag created',
            detail: saved.name,
            life: 3000
          });
          this.dialogVisible = false;
        },
        error: (error: unknown) => {
          this.messageService.add({
            severity: 'error',
            summary: current ? 'Could not update tag' : 'Could not create tag',
            detail: toErrorMessage(error),
            life: 5000
          });
        }
      });
  }

  onDelete(tag: Tag): void {
    const used = tag.taskCount ?? 0;
    const consequence =
      used === 0
        ? 'No tasks are using it.'
        : used === 1
          ? 'It will be removed from 1 task, which is otherwise left alone.'
          : `It will be removed from ${used} tasks, which are otherwise left alone.`;

    this.confirmationService.confirm({
      header: 'Delete tag',
      message: `Delete "${tag.name}"? ${consequence}`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.deleteTag(tag)
    });
  }

  isBusy(id: number): boolean {
    return this.busyIds().has(id);
  }

  textColor(color: string): string {
    return readableTextOn(color);
  }

  /**
   * The name field's message, or nothing while it is valid or untouched.
   *
   * <p>Moved out of the template so `<amb-form-field>` owns where it appears
   * and announces it — an error that only exists as markup cannot be given
   * {@code role="alert"} consistently across the screens that show one.</p>
   */
  nameError(): string | undefined {
    const control = this.form.controls.name;
    if (control.valid || !control.touched) {
      return undefined;
    }
    return control.hasError('required')
      ? 'Name is required.'
      : 'Name cannot be longer than 40 characters.';
  }

  get dialogHeader(): string {
    return this.editing() ? 'Edit tag' : 'New tag';
  }

  /** Live preview in the dialog, so the colour choice is visible before saving. */
  get previewName(): string {
    const typed = this.form.controls.name.value.trim();
    return typed.length > 0 ? typed : 'Tag name';
  }

  get previewColor(): string {
    return this.form.controls.color.value;
  }

  private deleteTag(tag: Tag): void {
    this.setBusy(tag.id, true);
    this.tagService
      .remove(tag.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setBusy(tag.id, false);
          this.messageService.add({
            severity: 'success',
            summary: 'Tag deleted',
            detail: tag.name,
            life: 3000
          });
        },
        error: (error: unknown) => {
          this.setBusy(tag.id, false);
          this.messageService.add({
            severity: 'error',
            summary: 'Delete failed',
            detail: toErrorMessage(error, `"${tag.name}" could not be deleted.`),
            life: 5000
          });
        }
      });
  }

  private setBusy(id: number, busy: boolean): void {
    this.busyIds.update((current) => {
      const next = new Set(current);
      if (busy) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
