import type { Data } from "@measured/puck"

export interface HTMLSection {
  type: 'header' | 'slider' | 'news' | 'gallery' | 'events' | 'activities' | 'footer' | 'popup' | 'custom'
  html: string
  css?: string
  metadata?: any
}

export class HTMLToPuckConverter {
  
  static detectSections(html: string): HTMLSection[] {
    const sections: HTMLSection[] = []
    
    // Create a temporary DOM to parse HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Detect different sections based on common patterns
    this.detectHeaders(doc, sections)
    this.detectSliders(doc, sections)
    this.detectNews(doc, sections)
    this.detectGalleries(doc, sections)
    this.detectEvents(doc, sections)
    this.detectActivities(doc, sections)
    this.detectFooters(doc, sections)
    this.detectPopups(doc, sections)
    
    // If no specific sections detected, treat as custom HTML
    if (sections.length === 0) {
      sections.push({
        type: 'custom',
        html: html
      })
    }
    
    return sections
  }
  
  static detectHeaders(doc: Document, sections: HTMLSection[]) {
    const headers = doc.querySelectorAll('header, .header, nav, .navbar, .navigation')
    headers.forEach(header => {
      const logo = header.querySelector('img, .logo')
      const nav = header.querySelector('nav, .nav, .menu')
      
      sections.push({
        type: 'header',
        html: header.outerHTML,
        metadata: {
          hasLogo: !!logo,
          hasNavigation: !!nav,
          logoSrc: logo?.getAttribute('src') || '',
          menuItems: this.extractMenuItems(nav)
        }
      })
    })
  }
  
  static detectSliders(doc: Document, sections: HTMLSection[]) {
    const sliders = doc.querySelectorAll('.slider, .carousel, .banner, .hero-slider, .swiper')
    sliders.forEach(slider => {
      const slides = slider.querySelectorAll('.slide, .carousel-item, .swiper-slide')
      
      sections.push({
        type: 'slider',
        html: slider.outerHTML,
        metadata: {
          slideCount: slides.length,
          slides: Array.from(slides).map(slide => ({
            image: slide.querySelector('img')?.getAttribute('src') || '',
            title: slide.querySelector('h1, h2, .title')?.textContent || '',
            subtitle: slide.querySelector('p, .subtitle')?.textContent || ''
          }))
        }
      })
    })
  }
  
  static detectNews(doc: Document, sections: HTMLSection[]) {
    const newsSelectors = [
      '.news', '.notices', '.announcements', '.blog',
      '[class*="news"]', '[class*="notice"]', '[class*="announcement"]'
    ]
    
    newsSelectors.forEach(selector => {
      const newsSection = doc.querySelector(selector)
      if (newsSection) {
        const newsItems = newsSection.querySelectorAll('.news-item, .notice-item, .post, article')
        
        sections.push({
          type: 'news',
          html: newsSection.outerHTML,
          metadata: {
            itemCount: newsItems.length,
            items: Array.from(newsItems).map(item => ({
              title: item.querySelector('h1, h2, h3, .title')?.textContent || '',
              content: item.querySelector('p, .content, .excerpt')?.textContent || '',
              date: item.querySelector('.date, time')?.textContent || '',
              link: item.querySelector('a')?.getAttribute('href') || ''
            }))
          }
        })
      }
    })
  }
  
  static detectGalleries(doc: Document, sections: HTMLSection[]) {
    const galleries = doc.querySelectorAll('.gallery, .photos, .images, [class*="gallery"]')
    galleries.forEach(gallery => {
      const images = gallery.querySelectorAll('img')
      
      sections.push({
        type: 'gallery',
        html: gallery.outerHTML,
        metadata: {
          imageCount: images.length,
          images: Array.from(images).map(img => ({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || '',
            caption: img.getAttribute('title') || img.closest('figure')?.querySelector('figcaption')?.textContent || ''
          }))
        }
      })
    })
  }
  
  static detectEvents(doc: Document, sections: HTMLSection[]) {
    const events = doc.querySelectorAll('.events, .calendar, [class*="event"]')
    events.forEach(eventSection => {
      const eventItems = eventSection.querySelectorAll('.event, .event-item, article')
      
      sections.push({
        type: 'events',
        html: eventSection.outerHTML,
        metadata: {
          eventCount: eventItems.length,
          events: Array.from(eventItems).map(event => ({
            title: event.querySelector('h1, h2, h3, .title')?.textContent || '',
            date: event.querySelector('.date, time')?.textContent || '',
            location: event.querySelector('.location, .venue')?.textContent || '',
            description: event.querySelector('p, .description')?.textContent || ''
          }))
        }
      })
    })
  }
  
  static detectActivities(doc: Document, sections: HTMLSection[]) {
    const activities = doc.querySelectorAll('.activities, .services, .features, [class*="activity"]')
    activities.forEach(activitySection => {
      const activityItems = activitySection.querySelectorAll('.activity, .service, .feature, .card')
      
      sections.push({
        type: 'activities',
        html: activitySection.outerHTML,
        metadata: {
          activityCount: activityItems.length,
          activities: Array.from(activityItems).map(activity => ({
            title: activity.querySelector('h1, h2, h3, .title')?.textContent || '',
            description: activity.querySelector('p, .description')?.textContent || '',
            icon: activity.querySelector('.icon')?.textContent || '',
            image: activity.querySelector('img')?.getAttribute('src') || ''
          }))
        }
      })
    })
  }
  
  static detectFooters(doc: Document, sections: HTMLSection[]) {
    const footers = doc.querySelectorAll('footer, .footer')
    footers.forEach(footer => {
      const links = footer.querySelectorAll('a')
      const sections_list = footer.querySelectorAll('.footer-section, .footer-column, .col')
      
      sections.push({
        type: 'footer',
        html: footer.outerHTML,
        metadata: {
          linkCount: links.length,
          sectionCount: sections_list.length,
          links: Array.from(links).map(link => ({
            text: link.textContent || '',
            url: link.getAttribute('href') || ''
          }))
        }
      })
    })
  }
  
  static detectPopups(doc: Document, sections: HTMLSection[]) {
    const popups = doc.querySelectorAll('.popup, .modal, .overlay, [class*="popup"]')
    popups.forEach(popup => {
      sections.push({
        type: 'popup',
        html: popup.outerHTML,
        metadata: {
          title: popup.querySelector('h1, h2, h3, .title')?.textContent || '',
          content: popup.querySelector('p, .content')?.textContent || ''
        }
      })
    })
  }
  
  static extractMenuItems(nav: Element | null): Array<{label: string, url: string}> {
    if (!nav) return []
    
    const links = nav.querySelectorAll('a')
    return Array.from(links).map(link => ({
      label: link.textContent?.trim() || '',
      url: link.getAttribute('href') || '#'
    }))
  }
  
  static convertToPuckData(html: string, css?: string): Data {
    const sections = this.detectSections(html)
    const puckContent: any[] = []
    
    sections.forEach((section, index) => {
      switch (section.type) {
        case 'header':
          puckContent.push({
            type: "DynamicHeader",
            props: {
              id: `header-${index}`,
              logoText: this.extractLogoText(section.html),
              menuItems: section.metadata?.menuItems || [],
              customCss: css || ''
            }
          })
          break
          
        case 'slider':
          puckContent.push({
            type: "DynamicSlider",
            props: {
              id: `slider-${index}`,
              slides: section.metadata?.slides || [],
              autoPlay: true,
              customCss: css || ''
            }
          })
          break
          
        case 'news':
          puckContent.push({
            type: "NewsNoticesSection",
            props: {
              id: `news-${index}`,
              title: "News & Notices",
              newsItems: section.metadata?.items || [],
              customCss: css || ''
            }
          })
          break
          
        case 'gallery':
          puckContent.push({
            type: "PhotoGallerySection",
            props: {
              id: `gallery-${index}`,
              title: "Photo Gallery",
              images: section.metadata?.images || [],
              customCss: css || ''
            }
          })
          break
          
        case 'events':
          puckContent.push({
            type: "EventsSection",
            props: {
              id: `events-${index}`,
              title: "Events",
              events: section.metadata?.events || [],
              customCss: css || ''
            }
          })
          break
          
        case 'activities':
          puckContent.push({
            type: "ActivitiesSection",
            props: {
              id: `activities-${index}`,
              title: "Activities",
              activities: section.metadata?.activities || [],
              customCss: css || ''
            }
          })
          break
          
        case 'footer':
          puckContent.push({
            type: "DynamicFooter",
            props: {
              id: `footer-${index}`,
              sections: this.extractFooterSections(section.html),
              customCss: css || ''
            }
          })
          break
          
        case 'popup':
          puckContent.push({
            type: "DynamicPopup",
            props: {
              id: `popup-${index}`,
              title: section.metadata?.title || '',
              content: section.metadata?.content || '',
              isVisible: false,
              customCss: css || ''
            }
          })
          break
          
        default:
          puckContent.push({
            type: "HTMLImportSection",
            props: {
              id: `custom-${index}`,
              htmlContent: section.html,
              cssContent: css || '',
              customCss: ''
            }
          })
      }
    })
    
    return {
      content: puckContent,
      root: { props: { title: "Imported Page" } }
    }
  }
  
  static extractLogoText(html: string): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const logoText = doc.querySelector('.logo-text, .brand, .site-title')?.textContent
    return logoText || "Your Website"
  }
  
  static extractFooterSections(html: string): Array<{title: string, links: Array<{label: string, url: string}>}> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const sections = doc.querySelectorAll('.footer-section, .footer-column, .col')
    
    return Array.from(sections).map(section => ({
      title: section.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || 'Links',
      links: Array.from(section.querySelectorAll('a')).map(link => ({
        label: link.textContent?.trim() || '',
        url: link.getAttribute('href') || '#'
      }))
    }))
  }
}
