## 2024-04-05 - Redundant Screen Reader Announcements in Icon-only Buttons
**Learning:** Screen readers often attempt to read both the `aria-label` of an icon-only button and the fallback/internal content of the icon element itself if it isn't properly hidden, leading to confusing double announcements.
**Action:** When adding `aria-label` to icon-only buttons (like FABs or action icons), ensure the internal SVG or icon components (like Lucide React icons) explicitly set `aria-hidden="true"`.
