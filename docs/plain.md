I want you to redesign and improve my existing Angular application into a **Modern Ambient UI** style.

### Current Technology

* Angular
* PrimeNG
* PrimeFlex
* SCSS

Do NOT replace the existing technology stack. Continue using Angular, PrimeNG, PrimeFlex, and SCSS.

### Design Direction

The new visual style should be called:

**Modern Ambient UI**

The overall feeling should be:

* Premium
* Modern
* Clean
* Smooth
* Spacious
* Professional
* Calm
* Slightly futuristic
* Suitable for a professional SaaS / ERP application

Use **soft glass surfaces, subtle transparency, ambient backgrounds, layered depth, soft shadows, smooth borders, and consistent spacing**.

Avoid making the application look overly colorful, flashy, or like a generic glassmorphism demo.

The UI should feel closer to a **premium modern SaaS product**.

### Important: Create a Reusable Ambient Component System

Do NOT individually style every PrimeNG component page by page.

Instead, create a reusable **Ambient UI component layer** on top of PrimeNG.

The goal is:

**PrimeNG components → Ambient wrapper/theme → Application pages**

For example:

* AmbientCard
* AmbientPanel
* AmbientButton
* AmbientInput
* AmbientSelect
* AmbientDialog
* AmbientTable
* AmbientToolbar
* AmbientFormField
* AmbientBadge
* AmbientAvatar
* AmbientDropdown
* AmbientMenu
* AmbientSidebar
* AmbientTabs
* AmbientEmptyState
* AmbientStatCard

These should reuse PrimeNG internally whenever possible instead of rebuilding components from scratch.

For example:

`AmbientCard` should use/stylize PrimeNG Card.

`AmbientButton` should use PrimeNG Button.

`AmbientDialog` should use PrimeNG Dialog.

`AmbientTable` should use PrimeNG Table.

The application should therefore remain compatible with PrimeNG functionality while getting a consistent Ambient UI appearance.

### Design Tokens

Create centralized SCSS design tokens for:

* Colors
* Background colors
* Surface colors
* Glass opacity
* Border colors
* Border radius
* Shadows
* Blur levels
* Spacing
* Typography
* Transitions
* Z-index/layering

Do not hardcode these values repeatedly throughout individual components.

For example, create a centralized structure similar to:

`_ambient-tokens.scss`

and reusable styles such as:

`_ambient-glass.scss`

`_ambient-components.scss`

`_ambient-layout.scss`

Use CSS variables where appropriate so the theme can be changed easily later.

### Glass / Ambient Surface

The glass effect should be subtle and professional.

Use:

* `backdrop-filter: blur(...)`
* Semi-transparent backgrounds
* Very subtle borders
* Soft shadows
* Slight highlights
* Layered surfaces

Avoid excessive blur or transparency that makes text difficult to read.

Example visual hierarchy:

Background
→ Ambient gradient / canvas
→ Main application surface
→ Glass card
→ Content

### Ambient Background

Create a reusable ambient background system.

The background can contain:

* Very subtle gradients
* Soft blurred radial shapes
* Light ambient glow
* Optional canvas-style decorative elements

The background should remain subtle and should never compete with application content.

It should feel like the UI is sitting inside a calm visual environment.

### Layout

Improve the overall layout to have:

* Consistent spacing
* Large but controlled whitespace
* Consistent border radius
* Strong visual hierarchy
* Clear page sections
* Comfortable content density
* Responsive behavior

Do not unnecessarily change the application's information architecture or business logic.

Focus primarily on **visual design, component architecture, consistency, and UX**.

### PrimeFlex

Continue using PrimeFlex for layout and utility classes where appropriate.

Avoid creating unnecessary custom CSS for things PrimeFlex already handles well.

Use SCSS for the design system and component styling.

### PrimeNG

Keep PrimeNG as the underlying UI component library.

Do not replace PrimeNG components with custom implementations unless there is a strong technical reason.

The Ambient component layer should make PrimeNG feel like one coherent design system.

### Consistency Rules

Every component should follow the same:

* Border radius
* Spacing scale
* Typography scale
* Surface hierarchy
* Shadow system
* Interaction states
* Focus states
* Hover states
* Disabled states
* Loading states

For example, all cards should feel like they belong to the same family.

Do not create different glass effects for different pages.

### Animation

Use subtle and professional animations.

Prefer:

* 150–300ms transitions
* Smooth hover effects
* Soft elevation changes
* Subtle opacity transitions
* Small transform effects

Avoid:

* Excessive bouncing
* Large movements
* Distracting animations
* Slow transitions

### Accessibility

The redesign must maintain good:

* Text contrast
* Keyboard navigation
* Focus visibility
* Form accessibility
* Screen-reader compatibility

Do not sacrifice usability for the glass effect.

### Responsive Design

The Ambient UI system must work well on:

* Desktop
* Laptop
* Tablet
* Mobile

The sidebar, cards, tables, dialogs, forms, and navigation should adapt appropriately.

### Architecture Goal

I want the final architecture to make future development easy.

Instead of:

Page A → custom styles
Page B → custom styles
Page C → custom styles

I want:

Ambient Design System
↓
Reusable Ambient Components
↓
Application Pages

So if I later want to change the card radius, glass opacity, shadow, or primary color, I should be able to change it centrally rather than editing every page.

### Important Implementation Rule

Before changing many pages, first establish the **Ambient Design System and reusable components**.

Then gradually migrate existing pages to use those components.

Do not rewrite the entire application unnecessarily.

Preserve existing:

* Business logic
* API calls
* Services
* Routing
* State management
* Forms behavior
* Permissions
* Existing PrimeNG functionality

The main objective is to transform the application visually into a **consistent, premium Modern Ambient UI system** while keeping the existing application architecture stable.

At the end, make sure the result feels like **one professionally designed SaaS product**, not a collection of individually styled pages.
