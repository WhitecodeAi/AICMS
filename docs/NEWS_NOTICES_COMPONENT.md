# News & Notices Component Documentation

This document provides comprehensive information about the News & Notices components available in the Puck JS page builder.

## Overview

The News & Notices system provides two main components:

1. **NewsNoticesSection** - Basic news component with static data
2. **NewsNoticesWidget** - Advanced component with dynamic data fetching and advanced features

## Components

### 1. NewsNoticesSection (Basic Component)

A simple, configurable news section that can be easily customized through the Puck editor.

#### Features
- Customizable layout (grid-2, grid-3, grid-4, list, masonry)
- Multiple card styles (card, modern, minimal, gradient, bordered)
- Configurable colors and styling
- Show/hide various elements (date, category, excerpt, etc.)
- Custom CSS support
- Animation options
- Priority badges

#### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `title` | text | Section title | "News & Notices" |
| `subtitle` | textarea | Section subtitle/description | - |
| `layout` | select | Layout style (grid-2, grid-3, grid-4, list, masonry) | "grid-3" |
| `maxItems` | number | Maximum items to display | 6 |
| `spacing` | select | Section spacing (compact, normal, spacious) | "normal" |
| `backgroundColor` | text | Background color | "#f8fafc" |
| `textColor` | text | Text color | "#1f2937" |
| `titleColor` | text | Title color | - |
| `cardBackgroundColor` | text | Card background color | "#ffffff" |
| `accentColor` | text | Accent color for links/categories | "#3b82f6" |
| `cardStyle` | select | Card style | "card" |
| `showDate` | radio | Show/hide dates | true |
| `showCategory` | radio | Show/hide categories | true |
| `showExcerpt` | radio | Show/hide excerpt | true |
| `animation` | radio | Enable animations | false |
| `newsItems` | array | News items data | Sample data |

#### News Item Structure

Each news item in the `newsItems` array can have:

```typescript
{
  title: string           // Required: News title
  content: string         // Required: Full content
  excerpt?: string        // Optional: Short excerpt
  date: string           // Required: Date (YYYY-MM-DD)
  category: string       // Required: Category name
  priority?: string      // Optional: 'low', 'medium', 'high'
  image?: string         // Optional: Image URL
  link?: string          // Optional: Read more link
  author?: string        // Optional: Author name
}
```

### 2. NewsNoticesWidget (Advanced Component)

An advanced component with data fetching capabilities, search, filtering, and interactive features.

#### Features
- Dynamic data fetching with the `useNewsData` hook
- Real-time search functionality
- Category filtering
- View toggle (grid/list)
- Auto-refresh capability
- Infinite scroll/load more
- Share functionality
- Read time estimation
- Advanced meta information
- Responsive design

#### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `title` | text | Section title | "News & Notices" |
| `subtitle` | textarea | Section subtitle/description | - |
| `showFilters` | radio | Show category filters | false |
| `showSearch` | radio | Show search bar | false |
| `showViewToggle` | radio | Show grid/list toggle | false |
| `layout` | select | Layout style | "grid-3" |
| `cardStyle` | select | Card style | "card" |
| `maxItems` | number | Maximum items to show | 6 |
| `showDate` | radio | Show dates | true |
| `showCategory` | radio | Show categories | true |
| `showAuthor` | radio | Show authors | false |
| `showExcerpt` | radio | Show excerpt | true |
| `showTags` | radio | Show tags | false |
| `showReadTime` | radio | Show read time | false |
| `backgroundColor` | text | Background color | "#f8fafc" |
| `textColor` | text | Text color | "#1f2937" |
| `titleColor` | text | Title color | - |
| `cardBackgroundColor` | text | Card background color | "#ffffff" |
| `accentColor` | text | Accent color | "#3b82f6" |
| `autoRefresh` | radio | Auto refresh | false |
| `refreshInterval` | number | Refresh interval (seconds) | 300 |
| `enableInfiniteScroll` | radio | Enable load more | false |
| `enableShare` | radio | Enable share button | false |

## Usage Examples

### Basic Implementation in Puck

1. Open the Puck editor (`/admin/builder`)
2. Add a new component
3. Select "NewsNoticesSection" or "NewsNoticesWidget"
4. Configure the component options in the right panel
5. Add your news items in the "News Items" array field
6. Preview and publish your page

### Programmatic Usage

```tsx
import { NewsNoticesSection, NewsNoticesWidget } from '@/lib/puck-config'

// Basic component
<NewsNoticesSection
  title="Latest Updates"
  subtitle="Stay informed with our latest news"
  layout="grid-3"
  cardStyle="modern"
  accentColor="#10b981"
  showDate={true}
  showCategory={true}
  newsItems={[
    {
      title: "Important Announcement",
      content: "This is important news...",
      date: "2024-01-15",
      category: "Announcements",
      priority: "high"
    }
  ]}
/>

// Advanced component with data fetching
<NewsNoticesWidget
  title="News & Updates"
  showSearch={true}
  showFilters={true}
  layout="grid-3"
  cardStyle="modern"
  maxItems={9}
  enableInfiniteScroll={true}
  autoRefresh={true}
  refreshInterval={300}
/>
```

### Custom Data Hook

Use the `useNewsData` hook for custom implementations:

```tsx
import { useNewsData } from '@/lib/hooks/useNewsData'

function CustomNewsComponent() {
  const { 
    news, 
    loading, 
    error, 
    categories, 
    fetchNews 
  } = useNewsData()

  // Filter by category
  const handleCategoryFilter = (category: string) => {
    fetchNews({ category })
  }

  // Search news
  const handleSearch = (searchTerm: string) => {
    fetchNews({ search: searchTerm })
  }

  return (
    // Your custom component JSX
  )
}
```

## Styling Guide

### CSS Variables

You can use CSS variables for consistent theming:

```css
:root {
  --news-primary-color: #3b82f6;
  --news-secondary-color: #10b981;
  --news-background-color: #f8fafc;
  --news-card-background: #ffffff;
  --news-text-color: #1f2937;
}
```

### Custom Styles

Add custom CSS through the `customCss` field:

```css
.news-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.news-card {
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.news-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
```

### Responsive Behavior

The components are fully responsive:

- **Mobile**: Single column layout
- **Tablet**: 2 columns for grid layouts
- **Desktop**: Full grid (2, 3, or 4 columns)

## Data Integration

### API Integration

To integrate with real data, modify the `useNewsData` hook:

```typescript
const fetchNews = async (filters: NewsFilters = {}) => {
  try {
    const response = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    })
    const data = await response.json()
    setNews(data.news)
    setTotalCount(data.total)
  } catch (error) {
    setError('Failed to fetch news')
  }
}
```

### Database Schema

Recommended database schema for news items:

```sql
CREATE TABLE news_items (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  author VARCHAR(255),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  tags JSON,
  publish_date DATETIME,
  expiry_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tenant_category (tenant_id, category),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_tenant_date (tenant_id, date),
  INDEX idx_featured (featured)
);
```

## Performance Optimization

### Best Practices

1. **Lazy Loading**: Images are lazy-loaded by default
2. **Pagination**: Use `maxItems` to limit initial load
3. **Caching**: Implement caching for API responses
4. **Optimization**: Use optimized images (WebP format)
5. **CDN**: Serve images through a CDN

### Loading States

The components include proper loading states:

- Skeleton loaders during data fetch
- Error handling with retry options
- Smooth transitions between states

## Accessibility

The components follow accessibility best practices:

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes

## Troubleshooting

### Common Issues

1. **Images not loading**: Check image URLs and CORS settings
2. **Data not updating**: Verify API endpoints and data format
3. **Styling issues**: Check CSS conflicts and specificity
4. **Performance**: Optimize images and implement pagination

### Debug Mode

Enable debug mode by adding to your component:

```tsx
<NewsNoticesWidget 
  {...props}
  debug={true}  // Shows debug information in console
/>
```

## Demo Pages

- **Basic Demo**: `/demo/news` - Showcases all component variations
- **Puck Editor**: `/admin/builder` - Interactive component editor
- **Admin Dashboard**: `/admin` - News management interface

For more advanced customization and integration options, refer to the source code in:
- `/lib/puck-config.tsx` - Component definitions
- `/lib/hooks/useNewsData.ts` - Data management hook
- `/components/widgets/NewsNoticesWidget.tsx` - Advanced widget component
