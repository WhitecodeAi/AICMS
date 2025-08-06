# Puck.js Dynamic Content Widgets Guide

## Overview

The Puck.js page builder now supports dynamic content from your CMS admin. You can use real sliders and galleries created in the admin panel directly in your pages.

## Available Widgets

### 1. ContentHelper Widget

**Purpose**: Shows available sliders and galleries with their IDs for easy reference.

**How to use**:
1. Add the "ContentHelper" widget to your page
2. It will display all available sliders and galleries with their IDs
3. Copy the IDs you want to use in other widgets

### 2. SliderWidget

**Purpose**: Display sliders created in the "Home Sliders" admin section.

**Configuration**:
- **Slider ID**: Enter the ID of the slider you want to display (shown in ContentHelper)
- **Slider Location**: Alternative way to select slider by location (homepage, header, custom)
- **Other settings**: Height, auto-play, transitions, etc.

**How to use**:
1. Go to `/admin/slider` to create a slider
2. Note the ID of your slider
3. Add "SliderWidget" to your Puck page
4. Enter the Slider ID in the configuration
5. Customize display settings as needed

### 3. GalleryWidget

**Purpose**: Display photo galleries created in the "Photo Gallery" admin section.

**Configuration**:
- **Gallery ID or Shortcode**: Enter the ID or shortcode of the gallery (shown in ContentHelper)
- **Layout**: Grid, masonry, or carousel
- **Other settings**: Columns, captions, lightbox, etc.

**How to use**:
1. Go to `/admin/gallery` to create a gallery
2. Note the ID or shortcode of your gallery
3. Add "GalleryWidget" to your Puck page
4. Enter the Gallery ID or shortcode
5. Customize layout and display settings

### 4. DynamicSlider (Legacy)

**Purpose**: Display sliders with support for both custom slides and managed content.

**Configuration**:
- **Slider ID**: ID from Home Sliders admin
- **Or Select by Location**: Choose by location if no ID specified
- **Custom Slides**: Manual slide configuration (fallback)

### 5. NewsNoticesWidget

**Purpose**: Display news and notices created in the "News" admin section.

**Configuration**:
- Multiple layout and display options
- Auto-refresh functionality
- Category filtering and search

## Step-by-Step Usage

### Setting Up a Homepage with Dynamic Content

1. **Create Content in Admin**:
   - Go to `/admin/slider` and create a homepage slider
   - Go to `/admin/gallery` and create a photo gallery
   - Go to `/admin/news` and add some news items

2. **Build Page in Puck**:
   - Go to `/admin/builder`
   - Add "ContentHelper" widget first to see available content IDs
   - Add "SliderWidget" and enter the slider ID
   - Add "GalleryWidget" and enter the gallery ID or shortcode
   - Add "NewsNoticesWidget" for dynamic news

3. **Configure and Publish**:
   - Customize each widget's settings
   - Preview your page
   - Save and publish

## Troubleshooting

### Slider Not Loading
- Check that the Slider ID is correct (use ContentHelper)
- Verify the slider is active in `/admin/slider`
- Check browser console for error messages

### Gallery Not Loading
- Verify the Gallery ID or shortcode is correct
- Ensure the gallery has images and is active
- Check that image URLs are accessible

### Content Not Updating
- Clear browser cache
- Check that content is published in admin
- Verify API endpoints are working

## Technical Details

### API Endpoints
- `/api/sliders` - Returns all sliders
- `/api/galleries` - Returns all galleries
- `/api/news` - Returns all news items

### Data Flow
1. Widgets fetch data from API endpoints
2. Content is matched by ID, shortcode, or location
3. Fallback content is shown if no match found
4. Real-time updates when content changes in admin

## Best Practices

1. **Use ContentHelper**: Always add ContentHelper widget first to see available content
2. **Consistent IDs**: Use meaningful IDs when creating content in admin
3. **Test Content**: Preview pages after adding widgets to ensure content loads
4. **Fallback Planning**: Provide alternative content for when dynamic content fails
5. **Performance**: Limit the number of images in galleries for better loading times
