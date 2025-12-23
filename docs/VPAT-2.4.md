# Voluntary Product Accessibility Template (VPAT®)

## AIBorg Learn Sphere - WCAG 2.1 Conformance Report

**Report Date:** December 2025 **Product Name:** AIBorg Learn Sphere **Product Version:** 2.0
**Product Description:** AI-powered learning management platform with adaptive assessments,
personalized learning paths, and comprehensive analytics. **Contact Information:**
accessibility@aiborg.ai **VPAT Version:** 2.4 (WCAG 2.1)

---

## Evaluation Summary

This Accessibility Conformance Report covers the degree of conformance for AIBorg Learn Sphere based
on the W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.

### Applicable Standards/Guidelines

| Standard/Guideline | Included In Report          |
| ------------------ | --------------------------- |
| WCAG 2.1           | Level A: Yes, Level AA: Yes |
| Section 508        | Yes (via WCAG mapping)      |
| EN 301 549         | Yes (via WCAG mapping)      |

### Terms Used

- **Supports:** The functionality of the product has at least one method that meets the criterion
  without known defects or meets with equivalent facilitation.
- **Partially Supports:** Some functionality of the product does not meet the criterion.
- **Does Not Support:** The majority of product functionality does not meet the criterion.
- **Not Applicable:** The criterion is not relevant to the product.

---

## WCAG 2.1 Report

### Table 1: Success Criteria, Level A

| Criteria                                         | Conformance Level  | Remarks and Explanations                                                                                      |
| ------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **1.1.1 Non-text Content**                       | Supports           | All images include alt text. Icon-only buttons include aria-label attributes. Decorative images use alt="".   |
| **1.2.1 Audio-only and Video-only**              | Partially Supports | Video content includes empty caption tracks. Transcript support is planned.                                   |
| **1.2.2 Captions (Prerecorded)**                 | Partially Supports | Caption track elements are present but captions are dynamically loaded. Full caption coverage in progress.    |
| **1.2.3 Audio Description or Media Alternative** | Partially Supports | Audio descriptions available for some educational videos. Coverage expanding.                                 |
| **1.3.1 Info and Relationships**                 | Supports           | Semantic HTML used throughout. Forms use proper label associations. Tables include proper headers.            |
| **1.3.2 Meaningful Sequence**                    | Supports           | Content follows logical reading order. CSS does not affect meaning.                                           |
| **1.3.3 Sensory Characteristics**                | Supports           | Instructions do not rely solely on sensory characteristics.                                                   |
| **1.4.1 Use of Color**                           | Partially Supports | Some status indicators use color. Text labels added to critical indicators. Pattern alternatives in progress. |
| **1.4.2 Audio Control**                          | Supports           | All audio/video has pause/stop controls. No auto-playing audio.                                               |
| **2.1.1 Keyboard**                               | Supports           | All interactive elements accessible via keyboard. Focus management implemented for modals.                    |
| **2.1.2 No Keyboard Trap**                       | Supports           | Focus can move freely. Modal dialogs properly trap and release focus.                                         |
| **2.1.4 Character Key Shortcuts**                | Supports           | No single-character shortcuts. All shortcuts use modifier keys.                                               |
| **2.2.1 Timing Adjustable**                      | Supports           | Timed assessments can be paused/extended. Session timeouts include warnings.                                  |
| **2.2.2 Pause, Stop, Hide**                      | Supports           | All animations can be paused. No content auto-updates without user control.                                   |
| **2.3.1 Three Flashes or Below Threshold**       | Supports           | No flashing content. Animations respect reduced-motion preferences.                                           |
| **2.4.1 Bypass Blocks**                          | Supports           | Skip links implemented for keyboard navigation.                                                               |
| **2.4.2 Page Titled**                            | Supports           | All pages have descriptive titles that identify content.                                                      |
| **2.4.3 Focus Order**                            | Supports           | Focus order matches visual layout. Tab navigation is logical.                                                 |
| **2.4.4 Link Purpose (In Context)**              | Supports           | Link text is descriptive. Generic links include context.                                                      |
| **2.5.1 Pointer Gestures**                       | Supports           | All actions achievable with single pointer. No path-based gestures required.                                  |
| **2.5.2 Pointer Cancellation**                   | Supports           | Actions occur on release, not down event. Can be cancelled.                                                   |
| **2.5.3 Label in Name**                          | Supports           | Visible labels match accessible names.                                                                        |
| **2.5.4 Motion Actuation**                       | Not Applicable     | No motion-based inputs.                                                                                       |
| **3.1.1 Language of Page**                       | Supports           | HTML lang attribute present on all pages.                                                                     |
| **3.2.1 On Focus**                               | Supports           | Focus does not trigger unexpected context changes.                                                            |
| **3.2.2 On Input**                               | Supports           | Form inputs do not trigger unexpected context changes.                                                        |
| **3.3.1 Error Identification**                   | Supports           | Form errors clearly identified in text. ARIA alerts announce errors.                                          |
| **3.3.2 Labels or Instructions**                 | Supports           | All form fields have labels. Required fields indicated.                                                       |
| **4.1.1 Parsing**                                | Supports           | Valid HTML. No duplicate IDs. Proper nesting.                                                                 |
| **4.1.2 Name, Role, Value**                      | Supports           | Custom components expose proper ARIA roles and states.                                                        |

### Table 2: Success Criteria, Level AA

| Criteria                                            | Conformance Level  | Remarks and Explanations                                              |
| --------------------------------------------------- | ------------------ | --------------------------------------------------------------------- |
| **1.2.4 Captions (Live)**                           | Not Applicable     | No live video content.                                                |
| **1.2.5 Audio Description (Prerecorded)**           | Partially Supports | Audio descriptions available for key educational videos.              |
| **1.3.4 Orientation**                               | Supports           | Content adapts to portrait and landscape orientations.                |
| **1.3.5 Identify Input Purpose**                    | Supports           | Form inputs use appropriate autocomplete attributes.                  |
| **1.4.3 Contrast (Minimum)**                        | Supports           | Text contrast ratio meets 4.5:1 minimum. Large text meets 3:1.        |
| **1.4.4 Resize Text**                               | Supports           | Content readable at 200% zoom. No horizontal scrolling.               |
| **1.4.5 Images of Text**                            | Supports           | No images of text except logos.                                       |
| **1.4.10 Reflow**                                   | Supports           | Content reflows at 320px width. No horizontal scrolling at 400% zoom. |
| **1.4.11 Non-text Contrast**                        | Supports           | UI components and graphics meet 3:1 contrast ratio.                   |
| **1.4.12 Text Spacing**                             | Supports           | Content remains usable with increased text spacing.                   |
| **1.4.13 Content on Hover or Focus**                | Supports           | Hover content dismissible, persistent, and hoverable.                 |
| **2.4.5 Multiple Ways**                             | Supports           | Multiple navigation methods: search, menus, breadcrumbs, site map.    |
| **2.4.6 Headings and Labels**                       | Supports           | Headings follow proper hierarchy. Labels describe purpose.            |
| **2.4.7 Focus Visible**                             | Supports           | Visible focus indicators on all interactive elements.                 |
| **3.1.2 Language of Parts**                         | Partially Supports | Multi-language content uses lang attribute when applicable.           |
| **3.2.3 Consistent Navigation**                     | Supports           | Navigation consistent across pages. Same order maintained.            |
| **3.2.4 Consistent Identification**                 | Supports           | Components with same function identified consistently.                |
| **3.3.3 Error Suggestion**                          | Supports           | Form validation provides specific correction suggestions.             |
| **3.3.4 Error Prevention (Legal, Financial, Data)** | Supports           | Assessment submissions are reversible. Confirmations required.        |
| **4.1.3 Status Messages**                           | Supports           | ARIA live regions announce status updates to screen readers.          |

---

## Accessibility Features

### Keyboard Navigation

- Full keyboard accessibility for all interactive elements
- Skip links to bypass navigation
- Visible focus indicators
- Logical tab order
- Escape key closes modals and dropdowns

### Screen Reader Support

- ARIA landmarks for page structure
- Descriptive labels for all interactive elements
- Live regions for dynamic content updates
- Proper heading hierarchy
- Form field labels and error messages

### Visual Accommodations

- High contrast color scheme
- Scalable text (supports 200% zoom)
- Respects prefers-reduced-motion
- Supports prefers-color-scheme (dark mode)
- No seizure-inducing content

### Cognitive Accommodations

- Clear, consistent navigation
- Error prevention and recovery
- Simple, understandable language
- Progress indicators for multi-step processes
- Timed activities can be extended

---

## Known Issues and Roadmap

### Current Limitations

1. **Video Captions**: Caption coverage at approximately 60%. Full coverage planned for Q1 2026.
2. **Audio Descriptions**: Available for key educational content. Expanding coverage ongoing.
3. **Color-Only Information**: Some analytics visualizations use color coding. Text alternatives
   being added.

### Planned Improvements

| Issue                              | Target Date | Status      |
| ---------------------------------- | ----------- | ----------- |
| Complete video caption coverage    | Q1 2026     | In Progress |
| Audio descriptions for all videos  | Q2 2026     | Planned     |
| Enhanced color contrast for charts | Q1 2026     | In Progress |
| Mobile screen reader optimization  | Q1 2026     | In Progress |

---

## Testing Methodology

### Automated Testing

- ESLint jsx-a11y plugin (continuous integration)
- Axe-core accessibility scanner
- Lighthouse accessibility audits

### Manual Testing

- Keyboard-only navigation testing
- Screen reader testing (NVDA, VoiceOver, JAWS)
- Color contrast verification
- Zoom and text resize testing

### Assistive Technology Tested

- NVDA 2024.3 with Firefox
- VoiceOver with Safari (macOS/iOS)
- JAWS 2024 with Chrome
- Windows Narrator with Edge
- TalkBack with Chrome (Android)

---

## Contact Information

For accessibility issues or accommodation requests:

**Email:** accessibility@aiborg.ai **Phone:** Available upon request **Response Time:** Within 2
business days

We welcome feedback to improve the accessibility of our platform.

---

## Legal Disclaimer

This VPAT® is provided for informational purposes only. The conformance levels stated are based on
evaluation at the time of report generation and may change with product updates. AIBorg is committed
to maintaining and improving accessibility.

VPAT® is a registered trademark of the Information Technology Industry Council (ITI).

---

**Document Version:** 1.0 **Last Updated:** December 2025 **Next Review:** March 2026
