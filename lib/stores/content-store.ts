'use client'

import type { Slider } from '@/lib/hooks/useSliderData'
import type { Gallery } from '@/lib/hooks/useGalleryData'

// Shared data store for sliders and galleries
// This ensures consistency between API routes and components

export let slidersStore: Slider[] = [
  {
    id: '1',
    name: "Homepage Hero Slider",
    description: "Main slider for homepage hero section",
    location: "homepage",
    isActive: true,
    settings: {
      autoPlay: true,
      autoPlaySpeed: 5,
      showDots: true,
      showArrows: true,
      infinite: true,
      pauseOnHover: true,
      transition: 'slide',
      height: '500px'
    },
    slides: [
      {
        id: '1',
        image: "https://via.placeholder.com/1200x600/3B82F6/FFFFFF?text=Welcome+to+Our+Platform",
        title: "Welcome to Our Platform",
        subtitle: "Experience excellence with our comprehensive solutions",
        description: "Discover innovative tools and services designed to help you achieve your goals with cutting-edge technology and dedicated support.",
        buttonText: "Get Started",
        buttonUrl: "/signup",
        order: 1,
        isActive: true,
        textPosition: "center",
        textColor: "#ffffff",
        overlayOpacity: 0.5
      },
      {
        id: '2',
        image: "https://via.placeholder.com/1200x600/10B981/FFFFFF?text=Advanced+Features",
        title: "Advanced Features",
        subtitle: "Powerful tools for modern workflows",
        description: "Take advantage of our advanced features including real-time collaboration, automated workflows, and comprehensive analytics to streamline your operations.",
        buttonText: "Learn More",
        buttonUrl: "/features",
        order: 2,
        isActive: true,
        textPosition: "left",
        textColor: "#ffffff",
        overlayOpacity: 0.4
      },
      {
        id: '3',
        image: "https://via.placeholder.com/1200x600/F59E0B/FFFFFF?text=Join+Our+Community",
        title: "Join Our Community",
        subtitle: "Connect with thousands of users worldwide",
        description: "Be part of our growing community of professionals, share knowledge, and collaborate on exciting projects with like-minded individuals.",
        buttonText: "Join Now",
        buttonUrl: "/community",
        order: 3,
        isActive: true,
        textPosition: "right",
        textColor: "#ffffff",
        overlayOpacity: 0.6
      }
    ]
  },
  {
    id: '2',
    name: "Announcements Slider",
    description: "Important announcements and updates",
    location: "header",
    isActive: true,
    settings: {
      autoPlay: true,
      autoPlaySpeed: 8,
      showDots: false,
      showArrows: false,
      infinite: true,
      pauseOnHover: true,
      transition: 'fade',
      height: '80px'
    },
    slides: [
      {
        id: '4',
        image: "https://via.placeholder.com/1200x200/EF4444/FFFFFF?text=Important+Update",
        title: "System Maintenance Scheduled",
        subtitle: "Brief downtime expected on Sunday, 2:00 AM - 4:00 AM EST",
        buttonText: "More Info",
        buttonUrl: "/maintenance",
        order: 1,
        isActive: true,
        textPosition: "center",
        textColor: "#ffffff",
        overlayOpacity: 0.8
      },
      {
        id: '5',
        image: "https://via.placeholder.com/1200x200/8B5CF6/FFFFFF?text=New+Features",
        title: "New Features Released",
        subtitle: "Check out our latest updates and improvements",
        buttonText: "View Updates",
        buttonUrl: "/updates",
        order: 2,
        isActive: true,
        textPosition: "center",
        textColor: "#ffffff",
        overlayOpacity: 0.7
      }
    ]
  },
  {
    id: '3',
    name: "Product Showcase",
    description: "Highlighting our key products and services",
    location: "custom",
    isActive: true,
    settings: {
      autoPlay: false,
      autoPlaySpeed: 6,
      showDots: true,
      showArrows: true,
      infinite: false,
      pauseOnHover: true,
      transition: 'slide',
      height: '400px'
    },
    slides: [
      {
        id: '6',
        image: "https://via.placeholder.com/1200x500/06B6D4/FFFFFF?text=Product+A",
        title: "Product Suite A",
        subtitle: "Complete solution for enterprise needs",
        description: "Our flagship product offering comprehensive tools for large-scale operations, including advanced analytics, team collaboration, and enterprise-grade security.",
        buttonText: "Explore",
        buttonUrl: "/products/suite-a",
        order: 1,
        isActive: true,
        textPosition: "left",
        textColor: "#1f2937",
        overlayOpacity: 0.2
      }
    ]
  }
]

export let galleriesStore: Gallery[] = [
  {
    id: '1',
    title: "Campus Events 2024",
    description: "Highlights from various campus events and activities throughout the year",
    shortcode: "campus-events-2024",
    category: "Events",
    department: "Student Affairs",
    academicYear: "2024",
    layout: "grid",
    columns: 3,
    showCaptions: true,
    lightbox: true,
    isActive: true,
    images: [
      {
        id: '1',
        src: "https://via.placeholder.com/600x400/3B82F6/FFFFFF?text=Campus+Event+1",
        alt: "Annual Sports Day",
        caption: "Students participating in the annual sports day celebration",
        category: "Sports",
        featured: true,
        order: 1
      },
      {
        id: '2',
        src: "https://via.placeholder.com/600x400/10B981/FFFFFF?text=Campus+Event+2",
        alt: "Cultural Festival",
        caption: "Cultural performances during the spring festival",
        category: "Culture",
        featured: false,
        order: 2
      },
      {
        id: '3',
        src: "https://via.placeholder.com/600x400/F59E0B/FFFFFF?text=Campus+Event+3",
        alt: "Graduation Ceremony",
        caption: "Class of 2024 graduation ceremony highlights",
        category: "Academic",
        featured: true,
        order: 3
      }
    ]
  },
  {
    id: '2',
    title: "Science Laboratory",
    description: "State-of-the-art facilities and research equipment",
    shortcode: "science-lab",
    category: "Facilities",
    department: "Science Department",
    academicYear: "2024",
    layout: "masonry",
    columns: 4,
    showCaptions: true,
    lightbox: true,
    isActive: true,
    images: [
      {
        id: '4',
        src: "https://via.placeholder.com/600x800/8B5CF6/FFFFFF?text=Lab+Equipment+1",
        alt: "Microscopy Lab",
        caption: "Advanced microscopy equipment for research",
        category: "Equipment",
        featured: true,
        order: 1
      },
      {
        id: '5',
        src: "https://via.placeholder.com/600x400/EF4444/FFFFFF?text=Lab+Equipment+2",
        alt: "Chemistry Lab",
        caption: "Modern chemistry laboratory setup",
        category: "Equipment",
        featured: false,
        order: 2
      }
    ]
  },
  {
    id: '3',
    title: "Student Achievements",
    description: "Recognition of outstanding student accomplishments",
    shortcode: "student-achievements",
    category: "Awards",
    department: "Academic Affairs",
    academicYear: "2024",
    layout: "carousel",
    columns: 1,
    showCaptions: true,
    lightbox: false,
    isActive: true,
    images: [
      {
        id: '6',
        src: "https://via.placeholder.com/800x400/06B6D4/FFFFFF?text=Achievement+1",
        alt: "National Competition Winner",
        caption: "First place in national science competition",
        category: "Awards",
        featured: true,
        order: 1
      }
    ]
  }
]

// Helper functions for managing the stores
export function addSlider(slider: Slider): void {
  slidersStore.unshift(slider)
}

export function updateSlider(id: string, updates: Partial<Slider>): Slider | null {
  const index = slidersStore.findIndex(s => s.id === id)
  if (index >= 0) {
    slidersStore[index] = { ...slidersStore[index], ...updates, id }
    return slidersStore[index]
  }
  return null
}

export function deleteSlider(id: string): boolean {
  const index = slidersStore.findIndex(s => s.id === id)
  if (index >= 0) {
    slidersStore.splice(index, 1)
    return true
  }
  return false
}

export function addGallery(gallery: Gallery): void {
  galleriesStore.unshift(gallery)
}

export function updateGallery(id: string, updates: Partial<Gallery>): Gallery | null {
  const index = galleriesStore.findIndex(g => g.id === id)
  if (index >= 0) {
    galleriesStore[index] = { ...galleriesStore[index], ...updates, id }
    return galleriesStore[index]
  }
  return null
}

export function deleteGallery(id: string): boolean {
  const index = galleriesStore.findIndex(g => g.id === id)
  if (index >= 0) {
    galleriesStore.splice(index, 1)
    return true
  }
  return false
}
