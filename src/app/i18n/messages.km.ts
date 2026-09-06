import { MessageCatalogue } from './messages.en';

/**
 * The Khmer message catalogue.
 *
 * <h2>Completeness is enforced, not audited</h2>
 *
 * <p>The {@link MessageCatalogue} annotation is what does it: the type is
 * {@code Record<MessageKey, string>} over the keys of the English catalogue, so
 * a key added there and forgotten here fails the build. That is the whole
 * reason the annotation is on the constant rather than inferred from it.</p>
 *
 * <h2>Notes on the Khmer</h2>
 *
 * <p>Khmer is written without spaces between words; a space marks a phrase
 * boundary, roughly where English would use a comma. The spacing in these
 * strings is therefore meaningful and not decorative — collapsing or adding a
 * space changes where the line is allowed to break.</p>
 *
 * <p>Khmer has no grammatical plural and no plural agreement, so the {@code
 * .one} and {@code .other} pairs the English catalogue needs are the same
 * sentence here. They are still written out twice rather than aliased: they are
 * separate keys that happen to coincide in this language, and merging them
 * would put a shape from one language into another language's file.</p>
 *
 * <p>Product nouns keep their English spelling where the English word is what
 * Khmer speakers use in practice for software ("API", "TaskPulse"), and are
 * translated where a settled Khmer term exists ("កិច្ចការ" for task,
 * "ស្លាក" for tag).</p>
 */
export const KM_MESSAGES: MessageCatalogue = {
  // -- Shared vocabulary ---------------------------------------------------

  'common.cancel': 'បោះបង់',
  'common.save': 'រក្សាទុក',
  'common.create': 'បង្កើត',
  'common.delete': 'លុប',
  'common.actions': 'សកម្មភាព',
  'common.tryAgain': 'ព្យាយាមម្ដងទៀត',
  'common.refresh': 'ផ្ទុកឡើងវិញ',

  'common.error.apiDown':
    'API របស់ TaskPulse មិនឆ្លើយតបទេ។ សូមពិនិត្យថាវាកំពុងដំណើរការ រួចព្យាយាមម្ដងទៀត។',
  'common.error.apiDownRetry': 'API របស់ TaskPulse មិនឆ្លើយតបទេ។ សូមព្យាយាមម្ដងទៀត។',
  'common.error.unreachable': 'មិនអាចទាក់ទងម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យថា API កំពុងដំណើរការ។',
  'common.error.generic': 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្ដងទៀត។',

  // -- Navigation and shell ------------------------------------------------

  'nav.dashboard': 'ផ្ទាំងគ្រប់គ្រង',
  'nav.tasks': 'កិច្ចការ',
  'nav.board': 'ក្ដារកិច្ចការ',
  'nav.tags': 'ស្លាក',
  'nav.landmark': 'មីនុយមេ',
  'nav.open': 'បើកមីនុយ',
  'nav.expand': 'ពង្រីកមីនុយ',
  'nav.collapse': 'បង្រួមមីនុយ',
  'nav.home': 'ទំព័រដើម {name}',

  'account.label': 'គណនី',
  'account.yours': 'គណនីរបស់អ្នក',
  'account.menu': 'មីនុយគណនីសម្រាប់ {name}',
  'account.signOut': 'ចាកចេញ',

  // -- Appearance ----------------------------------------------------------

  'appearance.legend': 'រូបរាង',
  'appearance.scheme': 'ទម្រង់ពណ៌',
  'appearance.light': 'ភ្លឺ',
  'appearance.dark': 'ងងឹត',
  'appearance.system': 'ប្រព័ន្ធ',
  'appearance.accentLegend': 'ពណ៌សំខាន់',
  'appearance.accent': 'ពណ៌សំខាន់',
  'appearance.trigger': 'រូបរាង៖ ទម្រង់ {scheme} ពណ៌សំខាន់ {accent}',
  'appearance.accent.indigo': 'ខៀវទុំ',
  'appearance.accent.violet': 'ស្វាយ',
  'appearance.accent.blue': 'ខៀវ',
  'appearance.accent.teal': 'ខៀវបៃតង',
  'appearance.accent.emerald': 'បៃតង',
  'appearance.accent.rose': 'ផ្កាឈូក',

  // -- Language ------------------------------------------------------------

  'language.legend': 'ភាសា',
  'language.group': 'ជ្រើសរើសភាសា',
  'language.trigger': 'ភាសា៖ {name}',

  // -- Task vocabulary -----------------------------------------------------

  'status.TODO': 'ត្រូវធ្វើ',
  'status.IN_PROGRESS': 'កំពុងធ្វើ',
  'status.DONE': 'រួចរាល់',

  'priority.URGENT': 'បន្ទាន់',
  'priority.HIGH': 'ខ្ពស់',
  'priority.MEDIUM': 'មធ្យម',
  'priority.LOW': 'ទាប',

  // -- Sign in / register --------------------------------------------------

  'auth.signInSubtitle': 'ចូលគណនី ដើម្បីបន្តពីកន្លែងដែលអ្នកបានឈប់។',
  'auth.registerSubtitle': 'បង្កើតគណនី ដើម្បីចាប់ផ្ដើមតាមដានការងារ។',
  'auth.expired': 'វគ្គរបស់អ្នកបានផុតកំណត់។ សូមចូលគណនីម្ដងទៀត។',
  'auth.modeGroup': 'ជ្រើសរើសថាចង់ចូលគណនី ឬបង្កើតគណនីថ្មី',
  'auth.signIn': 'ចូលគណនី',
  'auth.createAccount': 'បង្កើតគណនី',

  'auth.email': 'អ៊ីមែល',
  'auth.emailPlaceholder': 'you@example.com',
  'auth.password': 'ពាក្យសម្ងាត់',
  'auth.passwordPlaceholder': 'ពាក្យសម្ងាត់របស់អ្នក',
  'auth.name': 'ឈ្មោះរបស់អ្នក',
  'auth.namePlaceholder': 'សុខ សំណាង',
  'auth.newPasswordPlaceholder': 'យ៉ាងតិច {min} តួអក្សរ',
  'auth.passwordHint': '{min}–{max} តួអក្សរ។',

  'auth.error.emailRequired': 'ត្រូវការអ៊ីមែល។',
  'auth.error.emailInvalid': 'សូមបញ្ចូលអ៊ីមែលឱ្យបានត្រឹមត្រូវ។',
  'auth.error.emailMax': 'អ៊ីមែលមិនអាចវែងជាង {max} តួអក្សរបានទេ។',
  'auth.error.passwordRequired': 'ត្រូវការពាក្យសម្ងាត់។',
  'auth.error.passwordMin': 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច {min} តួអក្សរ។',
  'auth.error.passwordMax': 'ពាក្យសម្ងាត់មិនអាចវែងជាង {max} តួអក្សរបានទេ។',
  'auth.error.nameRequired': 'ត្រូវការឈ្មោះរបស់អ្នក។',
  'auth.error.nameMax': 'ឈ្មោះមិនអាចវែងជាង {max} តួអក្សរបានទេ។',

  'auth.error.signIn': 'មិនអាចចូលគណនីបានទេ',
  'auth.error.register': 'មិនអាចបង្កើតគណនីរបស់អ្នកបានទេ',

  // -- Dashboard -----------------------------------------------------------

  'dashboard.title': 'ផ្ទាំងគ្រប់គ្រង',
  'dashboard.subtitle': 'ស្ថានភាពការងាររបស់អ្នកនាពេលនេះ។',
  'dashboard.error.title': 'យើងមិនអាចផ្ទុកផ្ទាំងគ្រប់គ្រងរបស់អ្នកបានទេ',
  'dashboard.error.toast': 'មិនអាចផ្ទុកផ្ទាំងគ្រប់គ្រងបានទេ',

  'dashboard.figures': 'តួលេខសំខាន់ៗ',
  'dashboard.completionRate': 'អត្រាបញ្ចប់',
  'dashboard.completionMeter': 'អត្រាបញ្ចប់៖ {caption}',
  'dashboard.noTasks': 'មិនទាន់មានកិច្ចការ',
  'dashboard.completionCaption': 'រួចរាល់ {completed} ក្នុងចំណោម {total} កិច្ចការ',

  'dashboard.tile.open': 'មិនទាន់រួច',
  'dashboard.tile.inProgress': 'កំពុងធ្វើ',
  'dashboard.tile.overdue': 'ហួសកំណត់',
  'dashboard.tile.dueToday': 'ផុតកំណត់ថ្ងៃនេះ',
  'dashboard.tile.next7': '7 ថ្ងៃខាងមុខ',

  'dashboard.trend.title': 'បានបង្កើត និងបានបញ្ចប់',
  'dashboard.trend.subtitle':
    'បានបង្កើត {created} បានបញ្ចប់ {completed} ក្នុងរយៈពេល {days} ថ្ងៃចុងក្រោយ',
  'dashboard.trend.window': 'រយៈពេលនៃនិន្នាការ',
  'dashboard.trend.days': '{days} ថ្ងៃ',
  'dashboard.trend.showChart': 'ក្រាហ្វ',
  'dashboard.trend.showTable': 'តារាង',
  'dashboard.trend.showChartTip': 'បង្ហាញជាក្រាហ្វ',
  'dashboard.trend.showTableTip': 'បង្ហាញទិន្នន័យដដែលជាតារាង',
  'dashboard.trend.created': 'បានបង្កើត',
  'dashboard.trend.completed': 'បានបញ្ចប់',
  'dashboard.trend.day': 'ថ្ងៃ',
  'dashboard.trend.caption':
    'កិច្ចការដែលបានបង្កើត និងបានបញ្ចប់ក្នុងមួយថ្ងៃ ក្នុងរយៈពេល {days} ថ្ងៃចុងក្រោយ',
  'dashboard.trend.chartLabel':
    'ក្រាហ្វបន្ទាត់នៃកិច្ចការដែលបានបង្កើត និងបានបញ្ចប់ក្នុងមួយថ្ងៃ ក្នុងរយៈពេល {days} ថ្ងៃចុងក្រោយ។ សូមប្ដូរទៅតារាង ដើម្បីមើលតួលេខពិតប្រាកដ។',
  'dashboard.trend.empty': 'គ្មានសកម្មភាពក្នុងរយៈពេលនេះទេ',

  'dashboard.breakdowns': 'ការបែងចែក',
  'dashboard.priority.title': 'ការងារនៅសល់តាមអាទិភាព',
  'dashboard.priority.subtitle': 'មិនរាប់បញ្ចូលកិច្ចការដែលរួចរាល់ទេ។',
  'dashboard.priority.empty': 'គ្មានអ្វីនៅសល់ទេ។ អ្វីៗរួចរាល់ទាំងអស់។',
  'dashboard.tags.title': 'ស្លាកដែលប្រើច្រើនជាងគេ',
  'dashboard.tags.subtitle': 'ចំនួនកិច្ចការដែលប្រើស្លាកនីមួយៗ។',

  'dashboard.tags.emptyBefore': 'មិនទាន់មានស្លាកប្រើប្រាស់ទេ។ សូមបន្ថែមនៅផ្ទាំង',
  'dashboard.tags.emptyLink': 'ស្លាក',
  'dashboard.tags.emptyAfter': '។',

  // -- Task list -----------------------------------------------------------

  'tasks.title': 'កិច្ចការ',
  'tasks.new': 'កិច្ចការថ្មី',
  'tasks.add': 'បន្ថែមកិច្ចការ',
  'tasks.error.title': 'យើងមិនអាចផ្ទុកកិច្ចការរបស់អ្នកបានទេ',
  'tasks.error.toast': 'មិនអាចផ្ទុកកិច្ចការបានទេ',

  'tasks.summary.loading': 'កំពុងផ្ទុកកិច្ចការរបស់អ្នក...',
  'tasks.summary.none': 'មិនមានអ្វីនៅក្នុងបញ្ជីទេឥឡូវនេះ។',
  'tasks.summary.noMatches': 'គ្មានកិច្ចការត្រូវនឹងតម្រងទាំងនេះទេ។',
  'tasks.summary.total.one': 'សរុប {count} កិច្ចការ។',
  'tasks.summary.total.other': 'សរុប {count} កិច្ចការ។',
  'tasks.summary.matching.one': 'ត្រូវគ្នា {count} កិច្ចការ។',
  'tasks.summary.matching.other': 'ត្រូវគ្នា {count} កិច្ចការ។',

  'tasks.search.placeholder': 'ស្វែងរកចំណងជើង និងការពិពណ៌នា',
  'tasks.search.label': 'ស្វែងរកកិច្ចការតាមចំណងជើង ឬការពិពណ៌នា',
  'tasks.scope.label': 'តម្រងរហ័ស',
  'tasks.scope.all': 'ទាំងអស់',
  'tasks.scope.open': 'មិនទាន់រួច',
  'tasks.scope.overdue': 'ហួសកំណត់',
  'tasks.scope.done': 'រួចរាល់',
  'tasks.filter.status': 'ស្ថានភាព',
  'tasks.filter.statusLabel': 'ត្រងតាមស្ថានភាព',
  'tasks.filter.priority': 'អាទិភាព',
  'tasks.filter.priorityLabel': 'ត្រងតាមអាទិភាព',
  'tasks.filter.tags': 'ស្លាក',
  'tasks.filter.tagsLabel': 'ត្រងតាមស្លាក',
  'tasks.filter.clear': 'សម្អាត ({count})',
  'tasks.filter.clearPlain': 'សម្អាតតម្រង',

  'tasks.col.task': 'កិច្ចការ',
  'tasks.col.priority': 'អាទិភាព',
  'tasks.col.due': 'កាលកំណត់',
  'tasks.col.status': 'ស្ថានភាព',

  'tasks.empty.filtered.title': 'គ្មានកិច្ចការត្រូវនឹងតម្រងទាំងនេះទេ',
  'tasks.empty.filtered.text':
    'សូមពង្រីកការស្វែងរក ឬសម្អាតតម្រង ដើម្បីមើលទាំងអស់។',
  'tasks.empty.title': 'មិនទាន់មានកិច្ចការ',
  'tasks.empty.text':
    'បន្ថែមកិច្ចការដំបូងរបស់អ្នក រួច TaskPulse នឹងរក្សាកាលកំណត់របស់វាឱ្យនៅក្នុងការមើលឃើញ។',

  'tasks.due.overdue': 'ហួសកំណត់',
  'tasks.due.today': 'ផុតកំណត់ថ្ងៃនេះ',
  'tasks.due.none': 'គ្មានកាលកំណត់',
  'tasks.markDone': 'សម្គាល់ថារួចរាល់',
  'tasks.markPending': 'សម្គាល់ថាមិនទាន់រួច',
  'tasks.edit': 'កែសម្រួលកិច្ចការ',
  'tasks.deleteAction': 'លុបកិច្ចការ',

  'tasks.toast.completed': 'កិច្ចការរួចរាល់',
  'tasks.toast.reopened': 'កិច្ចការត្រូវបានបើកឡើងវិញ',
  'tasks.toast.updateFailed': 'ការធ្វើបច្ចុប្បន្នភាពបរាជ័យ',
  'tasks.toast.updateFailedDetail': 'មិនអាចធ្វើបច្ចុប្បន្នភាព «{title}» បានទេ។',
  'tasks.toast.deleted': 'កិច្ចការត្រូវបានលុប',
  'tasks.toast.deleteFailed': 'ការលុបបរាជ័យ',
  'tasks.toast.deleteFailedDetail': 'មិនអាចលុប «{title}» បានទេ។',

  'tasks.confirm.header': 'លុបកិច្ចការ',
  'tasks.confirm.message': 'លុប «{title}» មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',

  // -- Task form -----------------------------------------------------------

  'taskForm.new': 'កិច្ចការថ្មី',
  'taskForm.edit': 'កែសម្រួលកិច្ចការ',
  'taskForm.title': 'ចំណងជើង',
  'taskForm.titlePlaceholder': 'តើត្រូវធ្វើអ្វីខ្លះ?',
  'taskForm.description': 'ការពិពណ៌នា',
  'taskForm.descriptionPlaceholder': 'បន្ថែមព័ត៌មានលម្អិតបន្តិច (មិនចាំបាច់)',
  'taskForm.status': 'ស្ថានភាព',
  'taskForm.priority': 'អាទិភាព',
  'taskForm.due': 'កាលកំណត់',
  'taskForm.duePlaceholder': 'ឆ្នាំ-ខែ-ថ្ងៃ',
  'taskForm.tags': 'ស្លាក',
  'taskForm.tagsPlaceholder': 'បន្ថែមស្លាក (មិនចាំបាច់)',
  'taskForm.tagsEmpty': 'មិនទាន់មានស្លាក',
  'taskForm.tagsHint':
    'អ្នកមិនទាន់មានស្លាកទេ។ សូមបង្កើតនៅផ្ទាំងស្លាក រួចវានឹងបង្ហាញនៅទីនេះ។',

  'taskForm.error.titleRequired': 'ត្រូវការចំណងជើង។',
  'taskForm.error.titleMax': 'ចំណងជើងមិនអាចវែងជាង {max} តួអក្សរបានទេ។',

  'taskForm.toast.created': 'កិច្ចការត្រូវបានបង្កើត',
  'taskForm.toast.updated': 'កិច្ចការត្រូវបានធ្វើបច្ចុប្បន្នភាព',
  'taskForm.error.create': 'មិនអាចបង្កើតកិច្ចការបានទេ',
  'taskForm.error.update': 'មិនអាចធ្វើបច្ចុប្បន្នភាពកិច្ចការបានទេ',

  // -- Board ---------------------------------------------------------------

  'board.title': 'ក្ដារកិច្ចការ',
  'board.error.title': 'យើងមិនអាចផ្ទុកក្ដារកិច្ចការរបស់អ្នកបានទេ',
  'board.error.toast': 'មិនអាចផ្ទុកក្ដារកិច្ចការបានទេ',

  'board.summary.loading': 'កំពុងផ្ទុកក្ដារកិច្ចការរបស់អ្នក...',
  'board.summary.none': 'មិនទាន់មានអ្វីនៅលើក្ដារទេ។',
  'board.summary': 'មិនទាន់រួច {open} រួចរាល់ {done}។ អូសកាតដើម្បីផ្លាស់ទី។',

  'board.empty.title': 'ក្ដារកិច្ចការរបស់អ្នកទទេ',
  'board.empty.text':
    'បន្ថែមកិច្ចការមួយ រួចវានឹងបង្ហាញនៅក្នុងជួរ «ត្រូវធ្វើ» ត្រៀមឱ្យអូសទៅមុខតាមដំណើរការងាររបស់អ្នក។',
  'board.column': 'ជួរ {label}',
  'board.columnEmpty': 'ទម្លាក់កិច្ចការនៅទីនេះ',
  'board.addTo': 'បន្ថែមកិច្ចការទៅជួរ {label}',
  'board.due': 'កាលកំណត់',

  'board.error.move': 'មិនអាចផ្លាស់ទីកិច្ចការបានទេ',
  'board.error.moveDetail': '«{title}» ត្រូវបានដាក់ត្រឡប់ទៅកន្លែងដើមវិញ។',

  // -- Tags ----------------------------------------------------------------

  'tags.title': 'ស្លាក',
  'tags.new': 'ស្លាកថ្មី',
  'tags.error.title': 'យើងមិនអាចផ្ទុកស្លាករបស់អ្នកបានទេ',
  'tags.error.toast': 'មិនអាចផ្ទុកស្លាកបានទេ',

  'tags.summary.loading': 'កំពុងផ្ទុកស្លាករបស់អ្នក...',
  'tags.summary.none': 'មិនទាន់មានស្លាកទេ។',
  'tags.summary.one': '{count} ស្លាក។',
  'tags.summary.other': '{count} ស្លាក។',

  'tags.col.tag': 'ស្លាក',
  'tags.col.tasks': 'កិច្ចការ',
  'tags.unused': 'មិនប្រើ',

  'tags.empty.title': 'មិនទាន់មានស្លាក',
  'tags.empty.text':
    'ស្លាកជួយដាក់ជាក្រុមនូវកិច្ចការដែលពាក់ព័ន្ធ ហើយផ្ដល់ឱ្យបញ្ជី និងក្ដារកិច្ចការនូវអ្វីដែលអាចត្រងបាន។',
  'tags.empty.action': 'បង្កើតស្លាក',

  'tags.edit': 'កែសម្រួលស្លាក',
  'tags.deleteAction': 'លុបស្លាក',
  'tags.dialog.new': 'ស្លាកថ្មី',
  'tags.dialog.edit': 'កែសម្រួលស្លាក',
  'tags.name': 'ឈ្មោះ',
  'tags.namePlaceholder': 'ការងារ, ផ្ទាល់ខ្លួន, បន្ទាន់...',
  'tags.colour': 'ពណ៌',
  'tags.colourOption': 'ពណ៌ {value}',
  'tags.preview': 'មើលជាមុន',
  'tags.previewName': 'ឈ្មោះស្លាក',

  'tags.error.nameRequired': 'ត្រូវការឈ្មោះ។',
  'tags.error.nameMax': 'ឈ្មោះមិនអាចវែងជាង {max} តួអក្សរបានទេ។',

  'tags.toast.created': 'ស្លាកត្រូវបានបង្កើត',
  'tags.toast.updated': 'ស្លាកត្រូវបានធ្វើបច្ចុប្បន្នភាព',
  'tags.toast.deleted': 'ស្លាកត្រូវបានលុប',
  'tags.toast.deleteFailed': 'ការលុបបរាជ័យ',
  'tags.toast.deleteFailedDetail': 'មិនអាចលុប «{name}» បានទេ។',
  'tags.error.create': 'មិនអាចបង្កើតស្លាកបានទេ',
  'tags.error.update': 'មិនអាចធ្វើបច្ចុប្បន្នភាពស្លាកបានទេ',

  'tags.confirm.header': 'លុបស្លាក',
  'tags.confirm.message': 'លុប «{name}» មែនទេ? {consequence}',
  'tags.confirm.unused': 'គ្មានកិច្ចការណាកំពុងប្រើវាទេ។',
  'tags.confirm.usedOne': 'វានឹងត្រូវដកចេញពី 1 កិច្ចការ ដែលនៅសល់មិនប៉ះពាល់អ្វីទេ។',
  'tags.confirm.usedOther': 'វានឹងត្រូវដកចេញពី {count} កិច្ចការ ដែលនៅសល់មិនប៉ះពាល់អ្វីទេ។',

  // -- PrimeNG's own chrome ------------------------------------------------

  'primeng.pageReport': '{first}-{last} ក្នុងចំណោម {totalRecords}',
  'primeng.today': 'ថ្ងៃនេះ',
  'primeng.clear': 'សម្អាត',
  'primeng.weekHeader': 'សប្ដាហ៍',
  'primeng.chooseDate': 'ជ្រើសរើសកាលបរិច្ឆេទ',
  'primeng.chooseMonth': 'ជ្រើសរើសខែ',
  'primeng.chooseYear': 'ជ្រើសរើសឆ្នាំ',
  'primeng.prevMonth': 'ខែមុន',
  'primeng.nextMonth': 'ខែបន្ទាប់',
  'primeng.prevYear': 'ឆ្នាំមុន',
  'primeng.nextYear': 'ឆ្នាំបន្ទាប់',
  'primeng.prevDecade': 'ទសវត្សរ៍មុន',
  'primeng.nextDecade': 'ទសវត្សរ៍បន្ទាប់',
  'primeng.accept': 'បាទ/ចាស',
  'primeng.reject': 'ទេ',
  'primeng.emptyMessage': 'រកមិនឃើញលទ្ធផលទេ',
  'primeng.emptySelectionMessage': 'គ្មានធាតុដែលបានជ្រើសរើស',
  'primeng.selectionMessage': 'បានជ្រើសរើស {0} ធាតុ',
  'primeng.passwordPrompt': 'បញ្ចូលពាក្យសម្ងាត់',
  'primeng.weak': 'ខ្សោយ',
  'primeng.medium': 'មធ្យម',
  'primeng.strong': 'ខ្លាំង',
  'primeng.aria.close': 'បិទ',
  'primeng.aria.previous': 'មុន',
  'primeng.aria.next': 'បន្ទាប់',
  'primeng.aria.rowsPerPage': 'ជួរក្នុងមួយទំព័រ',
  'primeng.aria.firstPage': 'ទំព័រដំបូង',
  'primeng.aria.lastPage': 'ទំព័រចុងក្រោយ',
  'primeng.aria.nextPage': 'ទំព័របន្ទាប់',
  'primeng.aria.prevPage': 'ទំព័រមុន',
  'primeng.aria.selectAll': 'បានជ្រើសរើសធាតុទាំងអស់',
  'primeng.aria.unselectAll': 'បានដកការជ្រើសរើសធាតុទាំងអស់'
};
