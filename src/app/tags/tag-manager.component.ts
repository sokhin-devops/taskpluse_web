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
import { LocaleService } from '../i18n/locale.service';
import { TranslatePipe } from '../i18n/translate.pipe';

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
    AmbientTableComponent,
    TranslatePipe
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
  private readonly i18n = inject(LocaleService);

  readonly tags = this.tagService.tags;
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);

  readonly colorChoices = TAG_COLOR_CHOICES;
  readonly skeletonRows: number[] = [0, 1, 2, 3];

  /**
   * Longest name the API accepts, mirrored so the form can say so before making
   * a round trip. Named rather than written into the message, so the validator
   * and the sentence describing it cannot disagree.
   */
  private readonly maxNameLength = 40;

  readonly summary = computed(() => {
    if (this.loading()) {
      return this.i18n.t('tags.summary.loading');
    }
    const count = this.tags().length;
    if (count === 0) {
      return this.i18n.t('tags.summary.none');
    }
    // Two keys rather than one sentence with a noun swapped in: the number
    // agrees with more of the sentence than the noun in most languages, and
    // Khmer has no plural at all and reuses the same string.
    return this.i18n.t(count === 1 ? 'tags.summary.one' : 'tags.summary.other', { count });
  });

  /** Null while creating, the tag being edited otherwise. */
  readonly editing = signal<Tag | null>(null);
  dialogVisible = false;

  readonly form = this.fb.group({
    name: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(this.maxNameLength)]
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
            summary: this.i18n.t('tags.error.toast'),
            detail: toErrorMessage(error, this.i18n, 'common.error.apiDownRetry'),
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
            summary: this.i18n.t(current ? 'tags.toast.updated' : 'tags.toast.created'),
            detail: saved.name,
            life: 3000
          });
          this.dialogVisible = false;
        },
        error: (error: unknown) => {
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.t(current ? 'tags.error.update' : 'tags.error.create'),
            detail: toErrorMessage(error, this.i18n),
            life: 5000
          });
        }
      });
  }

  onDelete(tag: Tag): void {
    const used = tag.taskCount ?? 0;
    // Assembled from two keys so a translator controls both halves and the
    // join between them; the consequence clause is a whole sentence, not a
    // fragment to be glued onto another language's word order.
    const consequence =
      used === 0
        ? this.i18n.t('tags.confirm.unused')
        : this.i18n.t(used === 1 ? 'tags.confirm.usedOne' : 'tags.confirm.usedOther', {
            count: used
          });

    this.confirmationService.confirm({
      header: this.i18n.t('tags.confirm.header'),
      message: this.i18n.t('tags.confirm.message', { name: tag.name, consequence }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.t('common.delete'),
      rejectLabel: this.i18n.t('common.cancel'),
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
      ? this.i18n.t('tags.error.nameRequired')
      : this.i18n.t('tags.error.nameMax', { max: this.maxNameLength });
  }

  readonly dialogHeader = computed(() =>
    this.i18n.t(this.editing() ? 'tags.dialog.edit' : 'tags.dialog.new')
  );

  /** Live preview in the dialog, so the colour choice is visible before saving. */
  get previewName(): string {
    const typed = this.form.controls.name.value.trim();
    return typed.length > 0 ? typed : this.i18n.t('tags.previewName');
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
            summary: this.i18n.t('tags.toast.deleted'),
            detail: tag.name,
            life: 3000
          });
        },
        error: (error: unknown) => {
          this.setBusy(tag.id, false);
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.t('tags.toast.deleteFailed'),
            detail: toErrorMessage(error, this.i18n, 'tags.toast.deleteFailedDetail', {
              name: tag.name
            }),
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
