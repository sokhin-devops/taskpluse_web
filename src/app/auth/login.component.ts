import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { Observable, finalize } from 'rxjs';

import { toErrorMessage } from '../core/api-error';
import { AuthResponse, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '../core/auth/auth.model';
import { AuthService } from '../core/auth/auth.service';
import { TagService } from '../core/tag.service';

/** Which half of the screen is showing. */
type Mode = 'login' | 'register';

/** Rejects a value made only of whitespace, reusing the `required` error key. */
function notBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { required: true }
    : null;
}

/**
 * Sign-in and registration.
 *
 * <p>One component for both because the two forms share their layout, their submit
 * handling and their error presentation; only the fields and the endpoint differ. A
 * toggle between them keeps someone who mistook one for the other from having to
 * navigate away and lose what they typed.</p>
 */
@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    PasswordModule,
    SelectButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tagService = inject(TagService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly minPasswordLength = MIN_PASSWORD_LENGTH;
  readonly maxPasswordLength = MAX_PASSWORD_LENGTH;

  readonly mode = signal<Mode>('login');
  readonly submitting = signal(false);

  /** Shown when the guard bounced the user here because their token had expired. */
  readonly sessionExpired = signal(false);

  readonly modeOptions = [
    { label: 'Sign in', value: 'login' as Mode },
    { label: 'Create account', value: 'register' as Mode }
  ];

  readonly loginForm = this.fb.group({
    email: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    password: this.fb.control('', { nonNullable: true, validators: [Validators.required] })
  });

  readonly registerForm = this.fb.group({
    displayName: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100), notBlank]
    }),
    email: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(190)]
    }),
    password: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(MIN_PASSWORD_LENGTH),
        Validators.maxLength(MAX_PASSWORD_LENGTH)
      ]
    })
  });

  /** Where to go after signing in; set by the guard when it intercepted a deep link. */
  private redirectTo = '/dashboard';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.sessionExpired.set(params.get('expired') === 'true');
    this.redirectTo = params.get('redirectTo') ?? '/dashboard';
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
  }

  /**
   * True once a field has been touched and is invalid, so errors appear after typing
   * rather than greeting the user on an untouched form.
   *
   * <p>Takes the control itself rather than a form name and a field name: with typed
   * forms, a string lookup would have to widen the return type back to
   * {@code AbstractControl} and give up the checking that makes them worth using.</p>
   */
  showError(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  onSubmitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    this.submit(this.auth.login({ email: email.trim(), password }), 'Could not sign in');
  }

  onSubmitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { displayName, email, password } = this.registerForm.getRawValue();
    this.submit(
      this.auth.register({
        displayName: displayName.trim(),
        email: email.trim(),
        password
      }),
      'Could not create your account'
    );
  }

  private submit(request$: Observable<AuthResponse>, failureSummary: string): void {
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.sessionExpired.set(false);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false))
      )
      .subscribe({
        next: () => {
          // Whatever the previous account had cached is not this account's data.
          this.tagService.clear();
          void this.router.navigateByUrl(this.redirectTo);
        },
        error: (error: unknown) => {
          this.messageService.add({
            severity: 'error',
            summary: failureSummary,
            detail: toErrorMessage(error),
            life: 6000
          });
        }
      });
  }
}
