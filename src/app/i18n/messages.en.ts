/**
 * The English message catalogue, and the definition of what a message key is.
 *
 * <h2>Why this file is the source of truth</h2>
 *
 * <p>{@link MessageKey} is derived from this object rather than declared
 * separately, and every other catalogue is typed as
 * {@code Record<MessageKey, string>}. So adding a key here is what makes it
 * exist, and the compiler then refuses to build until every other language has
 * supplied it. A missing translation is a red squiggle at build time, not a
 * raw {@code tasks.filters.clear} appearing on screen in front of a user.</p>
 *
 * <h2>Shape</h2>
 *
 * <p>Flat and dotted, not nested. Nested objects read better in a JSON file
 * edited by hand; here the whole point is that the keys are a closed union
 * TypeScript can check, and a flat map gives that for free while a nested one
 * would need a recursive path type to get the same guarantee.</p>
 *
 * <p>Placeholders are <code>{named}</code> and are substituted by
 * {@link LocaleService.t}. Named rather than positional because word order is
 * exactly what changes between languages: "3 tasks in total" and its Khmer
 * equivalent do not put the number in the same place, and a translator has to
 * be free to move it.</p>
 *
 * <h2>What is deliberately not in here</h2>
 *
 * <p>The product name. "TaskPulse" is a name, not a word, and transliterating
 * it would leave the two languages disagreeing about what the application is
 * called.</p>
 */
export const EN_MESSAGES = {
  // -- Shared vocabulary ---------------------------------------------------
  //
  // Only for words that genuinely mean the same thing everywhere they appear.
  // A shared "Save" is safe; a shared "Open" would not be — it is a verb on a
  // button and an adjective on a dashboard tile, and Khmer does not use one
  // word for both.

  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.create': 'Create',
  'common.delete': 'Delete',
  'common.actions': 'Actions',
  'common.tryAgain': 'Try again',
  'common.refresh': 'Refresh',

  // Failure copy. Separate variants because the right one depends on whether
  // the user is looking at a whole screen that failed, a toast beside one that
  // did not, or a request that never left the machine.
  'common.error.apiDown':
    'The TaskPulse API did not respond. Check that it is running, then try again.',
  'common.error.apiDownRetry': 'The TaskPulse API did not respond. Please try again.',
  'common.error.unreachable': 'Cannot reach the server. Check that the API is running.',
  'common.error.generic': 'Something went wrong. Please try again.',

  // -- Navigation and shell ------------------------------------------------

  'nav.dashboard': 'Dashboard',
  'nav.tasks': 'Tasks',
  'nav.board': 'Board',
  'nav.tags': 'Tags',
  'nav.landmark': 'Main',
  'nav.open': 'Open navigation',
  'nav.expand': 'Expand navigation',
  'nav.collapse': 'Collapse navigation',
  'nav.home': '{name} home',

  'account.label': 'Account',
  'account.yours': 'your account',
  'account.menu': 'Account menu for {name}',
  'account.signOut': 'Sign out',

  // -- Appearance ----------------------------------------------------------

  'appearance.legend': 'Appearance',
  'appearance.scheme': 'Colour scheme',
  'appearance.light': 'Light',
  'appearance.dark': 'Dark',
  'appearance.system': 'System',
  'appearance.accentLegend': 'Accent',
  'appearance.accent': 'Accent colour',
  'appearance.trigger': 'Appearance: {scheme} theme, {accent} accent',
  'appearance.accent.indigo': 'Indigo',
  'appearance.accent.violet': 'Violet',
  'appearance.accent.blue': 'Blue',
  'appearance.accent.teal': 'Teal',
  'appearance.accent.emerald': 'Emerald',
  'appearance.accent.rose': 'Rose',

  // -- Language ------------------------------------------------------------

  'language.legend': 'Language',
  'language.group': 'Choose a language',
  'language.trigger': 'Language: {name}',

  // -- Task vocabulary -----------------------------------------------------
  //
  // The API sends `statusLabel` and `priorityLabel` already rendered, in
  // English. Those are ignored in favour of these, keyed off the enum the API
  // also sends, because a server that does not know what language the browser
  // is in cannot be the one to decide.

  'status.TODO': 'To do',
  'status.IN_PROGRESS': 'In progress',
  'status.DONE': 'Done',

  'priority.URGENT': 'Urgent',
  'priority.HIGH': 'High',
  'priority.MEDIUM': 'Medium',
  'priority.LOW': 'Low',

  // -- Sign in / register --------------------------------------------------

  'auth.signInSubtitle': 'Sign in to pick up where you left off.',
  'auth.registerSubtitle': 'Create an account to start tracking work.',
  'auth.expired': 'Your session expired. Please sign in again.',
  'auth.modeGroup': 'Choose whether to sign in or create an account',
  'auth.signIn': 'Sign in',
  'auth.createAccount': 'Create account',

  'auth.email': 'Email',
  'auth.emailPlaceholder': 'you@example.com',
  'auth.password': 'Password',
  'auth.passwordPlaceholder': 'Your password',
  'auth.name': 'Your name',
  'auth.namePlaceholder': 'Sam Rivera',
  'auth.newPasswordPlaceholder': 'At least {min} characters',
  'auth.passwordHint': '{min}–{max} characters.',

  'auth.error.emailRequired': 'Email is required.',
  'auth.error.emailInvalid': 'Enter a valid email address.',
  'auth.error.emailMax': 'Email cannot be longer than {max} characters.',
  'auth.error.passwordRequired': 'Password is required.',
  'auth.error.passwordMin': 'Password must be at least {min} characters.',
  'auth.error.passwordMax': 'Password cannot be longer than {max} characters.',
  'auth.error.nameRequired': 'Your name is required.',
  'auth.error.nameMax': 'Name cannot be longer than {max} characters.',

  'auth.error.signIn': 'Could not sign in',
  'auth.error.register': 'Could not create your account',

  // -- Dashboard -----------------------------------------------------------

  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Where your work stands right now.',
  'dashboard.error.title': 'We could not load your dashboard',
  'dashboard.error.toast': 'Could not load the dashboard',

  'dashboard.figures': 'Key figures',
  'dashboard.completionRate': 'Completion rate',
  'dashboard.completionMeter': 'Completion rate: {caption}',
  'dashboard.noTasks': 'No tasks yet',
  'dashboard.completionCaption': '{completed} of {total} tasks done',

  'dashboard.tile.open': 'Open',
  'dashboard.tile.inProgress': 'In progress',
  'dashboard.tile.overdue': 'Overdue',
  'dashboard.tile.dueToday': 'Due today',
  'dashboard.tile.next7': 'Next 7 days',

  'dashboard.trend.title': 'Created and completed',
  'dashboard.trend.subtitle': '{created} created, {completed} completed in the last {days} days',
  'dashboard.trend.window': 'Trend window',
  'dashboard.trend.days': '{days} days',
  'dashboard.trend.showChart': 'Chart',
  'dashboard.trend.showTable': 'Table',
  'dashboard.trend.showChartTip': 'Show the chart',
  'dashboard.trend.showTableTip': 'Show the same data as a table',
  'dashboard.trend.created': 'Created',
  'dashboard.trend.completed': 'Completed',
  'dashboard.trend.day': 'Day',
  'dashboard.trend.caption': 'Tasks created and completed per day over the last {days} days',
  'dashboard.trend.chartLabel':
    'Line chart of tasks created and completed per day over the last {days} days. Use the table view for the exact figures.',
  'dashboard.trend.empty': 'No activity in this window',

  'dashboard.breakdowns': 'Breakdowns',
  'dashboard.priority.title': 'Open work by priority',
  'dashboard.priority.subtitle': 'Completed tasks are left out.',
  'dashboard.priority.empty': 'Nothing open. Everything is done.',
  'dashboard.tags.title': 'Busiest tags',
  'dashboard.tags.subtitle': 'How many tasks carry each label.',

  // Split around the link rather than carrying markup in the string: a
  // translator must be able to move the link within the sentence, and Khmer
  // puts it in a different place from English.
  'dashboard.tags.emptyBefore': 'No tags in use yet. Add some on the',
  'dashboard.tags.emptyLink': 'Tags',
  'dashboard.tags.emptyAfter': 'screen.',

  // -- Task list -----------------------------------------------------------

  'tasks.title': 'Tasks',
  'tasks.new': 'New task',
  'tasks.add': 'Add task',
  'tasks.error.title': 'We could not load your tasks',
  'tasks.error.toast': 'Could not load tasks',

  'tasks.summary.loading': 'Loading your tasks...',
  'tasks.summary.none': 'Nothing on the list right now.',
  'tasks.summary.noMatches': 'No tasks match these filters.',
  'tasks.summary.total.one': '{count} task in total.',
  'tasks.summary.total.other': '{count} tasks in total.',
  'tasks.summary.matching.one': '{count} matching task.',
  'tasks.summary.matching.other': '{count} matching tasks.',

  'tasks.search.placeholder': 'Search title and description',
  'tasks.search.label': 'Search tasks by title or description',
  'tasks.scope.label': 'Quick filter',
  'tasks.scope.all': 'All',
  'tasks.scope.open': 'Open',
  'tasks.scope.overdue': 'Overdue',
  'tasks.scope.done': 'Done',
  'tasks.filter.status': 'Status',
  'tasks.filter.statusLabel': 'Filter by status',
  'tasks.filter.priority': 'Priority',
  'tasks.filter.priorityLabel': 'Filter by priority',
  'tasks.filter.tags': 'Tags',
  'tasks.filter.tagsLabel': 'Filter by tag',
  'tasks.filter.clear': 'Clear ({count})',
  'tasks.filter.clearPlain': 'Clear filters',

  'tasks.col.task': 'Task',
  'tasks.col.priority': 'Priority',
  'tasks.col.due': 'Due date',
  'tasks.col.status': 'Status',

  'tasks.empty.filtered.title': 'No tasks match these filters',
  'tasks.empty.filtered.text': 'Try widening the search, or clear the filters to see everything.',
  'tasks.empty.title': 'No tasks yet',
  'tasks.empty.text': 'Add your first task and TaskPulse will keep its due date in view.',

  'tasks.due.overdue': 'Overdue',
  'tasks.due.today': 'Due today',
  'tasks.due.none': 'No due date',
  'tasks.markDone': 'Mark as completed',
  'tasks.markPending': 'Mark as pending',
  'tasks.edit': 'Edit task',
  'tasks.deleteAction': 'Delete task',

  'tasks.toast.completed': 'Task completed',
  'tasks.toast.reopened': 'Task reopened',
  'tasks.toast.updateFailed': 'Update failed',
  'tasks.toast.updateFailedDetail': '"{title}" could not be updated.',
  'tasks.toast.deleted': 'Task deleted',
  'tasks.toast.deleteFailed': 'Delete failed',
  'tasks.toast.deleteFailedDetail': '"{title}" could not be deleted.',

  'tasks.confirm.header': 'Delete task',
  'tasks.confirm.message': 'Delete "{title}"? This cannot be undone.',

  // -- Task form -----------------------------------------------------------

  'taskForm.new': 'New task',
  'taskForm.edit': 'Edit task',
  'taskForm.title': 'Title',
  'taskForm.titlePlaceholder': 'What needs to be done?',
  'taskForm.description': 'Description',
  'taskForm.descriptionPlaceholder': 'Add a few details (optional)',
  'taskForm.status': 'Status',
  'taskForm.priority': 'Priority',
  'taskForm.due': 'Due date',
  'taskForm.duePlaceholder': 'yyyy-mm-dd',
  'taskForm.tags': 'Tags',
  'taskForm.tagsPlaceholder': 'Add tags (optional)',
  'taskForm.tagsEmpty': 'No tags yet',
  'taskForm.tagsHint':
    'You have no tags yet. Create some on the Tags screen and they will appear here.',

  'taskForm.error.titleRequired': 'Title is required.',
  'taskForm.error.titleMax': 'Title cannot be longer than {max} characters.',

  'taskForm.toast.created': 'Task created',
  'taskForm.toast.updated': 'Task updated',
  'taskForm.error.create': 'Could not create task',
  'taskForm.error.update': 'Could not update task',

  // -- Board ---------------------------------------------------------------

  'board.title': 'Board',
  'board.error.title': 'We could not load your board',
  'board.error.toast': 'Could not load the board',

  'board.summary.loading': 'Loading your board...',
  'board.summary.none': 'Nothing on the board yet.',
  'board.summary': '{open} open, {done} done. Drag a card to move it.',

  'board.empty.title': 'Your board is empty',
  'board.empty.text':
    'Add a task and it will appear in To do, ready to drag across as you work on it.',
  'board.column': '{label} column',
  'board.columnEmpty': 'Drop a task here',
  'board.addTo': 'Add a task to {label}',
  'board.due': 'Due date',

  'board.error.move': 'Could not move the task',
  'board.error.moveDetail': '"{title}" was put back where it was.',

  // -- Tags ----------------------------------------------------------------

  'tags.title': 'Tags',
  'tags.new': 'New tag',
  'tags.error.title': 'We could not load your tags',
  'tags.error.toast': 'Could not load tags',

  'tags.summary.loading': 'Loading your tags...',
  'tags.summary.none': 'No tags yet.',
  'tags.summary.one': '{count} tag.',
  'tags.summary.other': '{count} tags.',

  'tags.col.tag': 'Tag',
  'tags.col.tasks': 'Tasks',
  'tags.unused': 'Unused',

  'tags.empty.title': 'No tags yet',
  'tags.empty.text': 'Tags group related tasks and give the list and board something to filter by.',
  'tags.empty.action': 'Create a tag',

  'tags.edit': 'Edit tag',
  'tags.deleteAction': 'Delete tag',
  'tags.dialog.new': 'New tag',
  'tags.dialog.edit': 'Edit tag',
  'tags.name': 'Name',
  'tags.namePlaceholder': 'Work, Personal, Urgent...',
  'tags.colour': 'Colour',
  'tags.colourOption': 'Colour {value}',
  'tags.preview': 'Preview',
  'tags.previewName': 'Tag name',

  'tags.error.nameRequired': 'Name is required.',
  'tags.error.nameMax': 'Name cannot be longer than {max} characters.',

  'tags.toast.created': 'Tag created',
  'tags.toast.updated': 'Tag updated',
  'tags.toast.deleted': 'Tag deleted',
  'tags.toast.deleteFailed': 'Delete failed',
  'tags.toast.deleteFailedDetail': '"{name}" could not be deleted.',
  'tags.error.create': 'Could not create tag',
  'tags.error.update': 'Could not update tag',

  'tags.confirm.header': 'Delete tag',
  'tags.confirm.message': 'Delete "{name}"? {consequence}',
  'tags.confirm.unused': 'No tasks are using it.',
  'tags.confirm.usedOne': 'It will be removed from 1 task, which is otherwise left alone.',
  'tags.confirm.usedOther': 'It will be removed from {count} tasks, which are otherwise left alone.',

  // -- PrimeNG's own chrome ------------------------------------------------
  //
  // Handed to `PrimeNG.setTranslation()` rather than read through the pipe, but
  // kept here so a translator finds every string the product shows in one file.
  // The month and day names are not here: they come from Angular's own CLDR
  // locale data, which is already a dependency and is better maintained than a
  // hand-typed list would be. See `primeng-translations.ts`.

  'primeng.pageReport': '{first}-{last} of {totalRecords}',
  'primeng.today': 'Today',
  'primeng.clear': 'Clear',
  'primeng.weekHeader': 'Wk',
  'primeng.chooseDate': 'Choose date',
  'primeng.chooseMonth': 'Choose month',
  'primeng.chooseYear': 'Choose year',
  'primeng.prevMonth': 'Previous month',
  'primeng.nextMonth': 'Next month',
  'primeng.prevYear': 'Previous year',
  'primeng.nextYear': 'Next year',
  'primeng.prevDecade': 'Previous decade',
  'primeng.nextDecade': 'Next decade',
  'primeng.accept': 'Yes',
  'primeng.reject': 'No',
  'primeng.emptyMessage': 'No results found',
  'primeng.emptySelectionMessage': 'No selected item',
  'primeng.selectionMessage': '{0} items selected',
  'primeng.passwordPrompt': 'Enter a password',
  'primeng.weak': 'Weak',
  'primeng.medium': 'Medium',
  'primeng.strong': 'Strong',
  'primeng.aria.close': 'Close',
  'primeng.aria.previous': 'Previous',
  'primeng.aria.next': 'Next',
  'primeng.aria.rowsPerPage': 'Rows per page',
  'primeng.aria.firstPage': 'First page',
  'primeng.aria.lastPage': 'Last page',
  'primeng.aria.nextPage': 'Next page',
  'primeng.aria.prevPage': 'Previous page',
  'primeng.aria.selectAll': 'All items selected',
  'primeng.aria.unselectAll': 'All items unselected'
} as const;

/**
 * Every key the product can ask for.
 *
 * <p>Derived, not declared: the catalogue above is the only place a key is
 * written down, so the two can never drift.</p>
 */
export type MessageKey = keyof typeof EN_MESSAGES;

/** One language's strings. Every key, or it does not compile. */
export type MessageCatalogue = Readonly<Record<MessageKey, string>>;
