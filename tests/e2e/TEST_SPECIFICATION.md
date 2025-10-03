# E2E Test Specification - Student Content Access Features

## Test Coverage Overview

This document outlines the E2E testing strategy for all student content access features implemented in Phases 1-5.

---

## 1. PDF Viewer Tests (`pdf-viewer.spec.ts`)

### Test Suite: PDF Viewing
- ✅ **Load PDF document**
  - Navigate to course with PDF materials
  - Click "View" on PDF material
  - Verify PDF loads in modal
  - Verify page count displayed

- ✅ **Page Navigation**
  - Navigate to next page
  - Navigate to previous page
  - Jump to specific page number
  - Click thumbnail to jump to page
  - Verify current page indicator updates

- ✅ **Zoom Controls**
  - Zoom in (verify content scales up)
  - Zoom out (verify content scales down)
  - Reset zoom to 100%
  - Fit to width
  - Use zoom dropdown to select percentage

- ✅ **Search Functionality**
  - Open search tab
  - Enter search query
  - Verify results count
  - Click search result
  - Verify page navigates to match
  - Navigate next/previous results

- ✅ **Annotations**
  - Open annotations tab
  - Add new annotation on current page
  - Enter note text
  - Save annotation
  - Verify annotation appears in list
  - Edit existing annotation
  - Delete annotation
  - Click annotation to jump to page

- ✅ **Progress Tracking**
  - View multiple pages
  - Close and reopen PDF
  - Verify resumes at last viewed page
  - Verify progress percentage updates

- ✅ **Download PDF**
  - Click download button
  - Verify download initiated

---

## 2. Bookmarking Tests (`bookmarks.spec.ts`)

### Test Suite: Creating Bookmarks
- ✅ **Bookmark a Course**
  - Navigate to course page
  - Click bookmark button on course header
  - Fill in bookmark details (title, note, folder, tags)
  - Save bookmark
  - Verify bookmark icon changes state

- ✅ **Bookmark a Material**
  - Navigate to course materials
  - Click bookmark on a material
  - Verify bookmark saved
  - Check material shows as bookmarked

- ✅ **Bookmark Video Timestamp**
  - Play video to specific timestamp
  - Click bookmark during playback
  - Verify timestamp captured in metadata
  - Save bookmark with timestamp

- ✅ **Bookmark PDF Page**
  - Open PDF viewer
  - Navigate to specific page
  - Bookmark the page
  - Verify page number captured

### Test Suite: Managing Bookmarks
- ✅ **View All Bookmarks**
  - Navigate to `/bookmarks`
  - Verify all bookmarks displayed
  - Verify stats shown (total count, recent, folders)

- ✅ **Filter Bookmarks**
  - Filter by folder
  - Filter by content type
  - Search by title/note
  - Verify filtered results correct

- ✅ **Edit Bookmark**
  - Click bookmark item
  - Update title/note/tags
  - Save changes
  - Verify updates reflected

- ✅ **Delete Bookmark**
  - Click delete on bookmark
  - Confirm deletion
  - Verify bookmark removed
  - Verify count updated

- ✅ **Navigate from Bookmark**
  - Click bookmark for course
  - Verify navigates to course page
  - Click bookmark for material
  - Verify navigates to material

---

## 3. Download Management Tests (`downloads.spec.ts`)

### Test Suite: Downloading Files
- ✅ **Download Material**
  - Navigate to course materials
  - Click download button
  - Verify download tracked
  - Verify button shows "Downloaded" state

- ✅ **Re-download File**
  - Click download again on same material
  - Verify access count incremented
  - Verify last accessed updated

- ✅ **Download Different File Types**
  - Download video file
  - Download PDF file
  - Download presentation
  - Verify all tracked correctly

### Test Suite: Download History
- ✅ **View Download History**
  - Navigate to `/downloads`
  - Verify all downloads listed
  - Verify stats shown (total files, total size, counts by type)

- ✅ **View Most Accessed**
  - Verify most accessed section shows top 3
  - Verify access counts correct

- ✅ **Filter Downloads**
  - Filter by file type
  - Search by filename
  - Verify filtered results

- ✅ **Re-download from History**
  - Click re-download button
  - Verify download initiated
  - Verify access count incremented

- ✅ **Delete Download Record**
  - Click delete on download
  - Confirm deletion
  - Verify record removed

- ✅ **Clear All Downloads**
  - Click "Clear All" button
  - Confirm action
  - Verify all records cleared

---

## 4. Watch Later Queue Tests (`watch-later.spec.ts`)

### Test Suite: Adding to Queue
- ✅ **Add Video to Queue**
  - Navigate to course with video materials
  - Click "Watch Later" button on video
  - Verify button state changes
  - Verify toast notification

- ✅ **Remove from Queue**
  - Click "Watch Later" button again (already in queue)
  - Verify removed from queue
  - Verify button state changes back

### Test Suite: Queue Management
- ✅ **View Queue**
  - Navigate to `/watch-later`
  - Verify all queued items shown
  - Verify items in correct order (by position)

- ✅ **Reorder Queue**
  - Move item up
  - Verify position changed
  - Move item down
  - Verify position updated
  - Move to top
  - Verify moved to position 1

- ✅ **Add Note to Queue Item**
  - Click edit on queue item
  - Enter note text
  - Save note
  - Verify note displayed

- ✅ **Play Next**
  - Click "Play Next" button
  - Verify navigates to first item in queue

- ✅ **Play Specific Item**
  - Click "Play" on queue item
  - Verify navigates to that material

- ✅ **Remove from Queue**
  - Click delete on queue item
  - Confirm deletion
  - Verify item removed
  - Verify positions updated for remaining items

- ✅ **Clear Queue**
  - Click "Clear Queue"
  - Confirm action
  - Verify all items removed

---

## 5. Playlists Tests (`playlists.spec.ts`)

### Test Suite: Creating Playlists
- ✅ **Create New Playlist**
  - Navigate to `/playlists`
  - Click "New Playlist"
  - Enter title, description
  - Set public/private
  - Save playlist
  - Verify playlist appears in list

- ✅ **Create Public Playlist**
  - Create playlist with public toggle on
  - Verify globe icon shown
  - Verify other users can view (test with different account)

- ✅ **Create Private Playlist**
  - Create playlist with public toggle off
  - Verify lock icon shown

### Test Suite: Managing Playlists
- ✅ **Edit Playlist**
  - Click edit on playlist
  - Update title/description
  - Toggle public/private
  - Save changes
  - Verify updates reflected

- ✅ **Clone Playlist**
  - Click clone on playlist
  - Verify copy created with "(Copy)" suffix
  - Verify clone is private by default

- ✅ **Delete Playlist**
  - Click delete on playlist
  - Confirm deletion
  - Verify playlist removed

### Test Suite: Playlist Items (Future)
- ⏳ **Add Material to Playlist**
  - Navigate to material
  - Click "Add to Playlist"
  - Select playlist
  - Verify added

- ⏳ **View Playlist Items**
  - Click on playlist
  - Verify all items shown in order

- ⏳ **Reorder Playlist Items**
  - Drag item to new position
  - Verify order saved

- ⏳ **Remove from Playlist**
  - Click remove on item
  - Verify removed

- ⏳ **Play Playlist**
  - Click "Play" on playlist
  - Verify plays first item
  - Auto-advance to next (future)

---

## 6. Integration Tests (`integration.spec.ts`)

### Test Suite: Cross-Feature Integration
- ✅ **Bookmark and Download Same Material**
  - Bookmark a material
  - Download the same material
  - Verify both features work independently
  - Check both pages show correct data

- ✅ **Add to Watch Later and Bookmark**
  - Add video to watch later
  - Bookmark the same video
  - Verify both actions successful

- ✅ **Progress Tracking Across Features**
  - View PDF pages
  - Check progress in course page
  - Resume PDF
  - Verify continues from last page

- ✅ **Material Actions Button Group**
  - Verify all buttons present (Bookmark, Watch Later, View, Download)
  - Verify only appropriate buttons show (Watch Later only for videos)
  - Test all actions from same material card

---

## 7. Accessibility Tests (`accessibility.spec.ts`)

### Test Suite: Keyboard Navigation
- ✅ **Navigate with Tab**
  - Tab through PDF viewer controls
  - Verify focus visible
  - Verify can activate with Enter/Space

- ✅ **Keyboard Shortcuts**
  - Test arrow keys in PDF (next/prev page)
  - Test +/- for zoom
  - Verify escape closes modals

### Test Suite: Screen Reader Support
- ✅ **ARIA Labels**
  - Verify buttons have aria-labels
  - Verify modals have proper roles
  - Verify headings in correct hierarchy

---

## 8. Performance Tests (`performance.spec.ts`)

### Test Suite: Load Times
- ✅ **PDF Loading**
  - Measure time to load PDF viewer
  - Verify < 3 seconds for average PDF

- ✅ **Page Load Times**
  - Measure bookmarks page load
  - Measure downloads page load
  - Verify < 2 seconds

- ✅ **Database Queries**
  - Monitor network tab for excessive queries
  - Verify pagination working

---

## Test Data Requirements

### Prerequisite Data
- Test user account with student role
- Test course with enrollment
- Course materials:
  - At least 1 PDF (multi-page)
  - At least 2 videos
  - At least 1 presentation
- Test assignments

### Database State
- Clean state before each test suite
- Seed data for consistent testing
- Cleanup after tests

---

## Test Execution

### Commands
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npx playwright test pdf-viewer

# Run in UI mode (interactive)
npx playwright test --ui

# Run with specific browser
npx playwright test --project=chromium

# Generate report
npx playwright show-report
```

### CI/CD Integration
- Run on every PR
- Run nightly for full regression
- Fail build on test failures
- Store test artifacts (screenshots, videos)

---

## Success Criteria

All tests must:
- ✅ Pass consistently (< 1% flakiness)
- ✅ Complete in reasonable time (< 10 min total)
- ✅ Provide clear failure messages
- ✅ Clean up test data after execution
- ✅ Work across all browsers (Chrome, Firefox, Safari)

---

## Coverage Goals

- **Features**: 100% (all user-facing features tested)
- **Critical Paths**: 100% (auth, enrollment, content access)
- **Edge Cases**: 80% (error states, empty states, loading states)
- **Accessibility**: 90% (keyboard nav, screen reader)
