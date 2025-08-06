import { prisma } from '@/lib/prisma'

export interface DatabaseConfig {
  tenantId: string
}

/**
 * Database helper service for API operations
 * Provides convenient methods for CRUD operations with multi-tenant support
 */
export class DatabaseHelpers {
  /**
   * Gallery operations
   */
  static gallery = {
    async findMany(tenantId: string, filters: any = {}) {
      const where = { tenantId, ...filters }
      return prisma.gallery.findMany({ where })
    },

    async findById(tenantId: string, id: string) {
      return prisma.gallery.findFirst({
        where: { id, tenantId }
      })
    },

    async create(tenantId: string, data: any) {
      return prisma.gallery.create({
        data: { ...data, tenantId }
      })
    },

    async update(tenantId: string, id: string, data: any) {
      const existingGallery = await this.findById(tenantId, id)
      if (!existingGallery) {
        throw new Error('Gallery not found')
      }
      
      return prisma.gallery.update({
        where: { id },
        data
      })
    },

    async delete(tenantId: string, id: string) {
      const existingGallery = await this.findById(tenantId, id)
      if (!existingGallery) {
        throw new Error('Gallery not found')
      }
      
      return prisma.gallery.delete({
        where: { id }
      })
    },

    async checkShortcodeExists(tenantId: string, shortcode: string, excludeId?: string) {
      const where: any = { tenantId, shortcode }
      if (excludeId) {
        where.id = { not: excludeId }
      }
      
      const existing = await prisma.gallery.findFirst({ where })
      return !!existing
    }
  }

  /**
   * Menu operations
   */
  static menu = {
    async findMany(tenantId: string, filters: any = {}) {
      const where = { tenantId, ...filters }
      return prisma.menu.findMany({ where })
    },

    async findById(tenantId: string, id: string) {
      return prisma.menu.findFirst({
        where: { id, tenantId }
      })
    },

    async create(tenantId: string, data: any) {
      return prisma.menu.create({
        data: { ...data, tenantId }
      })
    },

    async update(tenantId: string, id: string, data: any) {
      const existingMenu = await this.findById(tenantId, id)
      if (!existingMenu) {
        throw new Error('Menu not found')
      }
      
      return prisma.menu.update({
        where: { id },
        data
      })
    },

    async delete(tenantId: string, id: string) {
      const existingMenu = await this.findById(tenantId, id)
      if (!existingMenu) {
        throw new Error('Menu not found')
      }
      
      return prisma.menu.delete({
        where: { id }
      })
    }
  }

  /**
   * News operations
   */
  static news = {
    async findMany(tenantId: string, filters: any = {}) {
      const where = { tenantId, ...filters }
      return prisma.newsItem.findMany({ where })
    },

    async findById(tenantId: string, id: string) {
      return prisma.newsItem.findFirst({
        where: { id, tenantId }
      })
    },

    async create(tenantId: string, data: any) {
      return prisma.newsItem.create({
        data: { ...data, tenantId }
      })
    },

    async update(tenantId: string, id: string, data: any) {
      const existingNews = await this.findById(tenantId, id)
      if (!existingNews) {
        throw new Error('News item not found')
      }
      
      return prisma.newsItem.update({
        where: { id },
        data
      })
    },

    async delete(tenantId: string, id: string) {
      const existingNews = await this.findById(tenantId, id)
      if (!existingNews) {
        throw new Error('News item not found')
      }
      
      return prisma.newsItem.delete({
        where: { id }
      })
    },

    async formatForResponse(newsItem: any) {
      return {
        id: newsItem.id,
        title: newsItem.title,
        content: newsItem.content,
        excerpt: newsItem.excerpt,
        date: newsItem.date.toISOString().split('T')[0],
        category: newsItem.category,
        priority: newsItem.priority,
        image: newsItem.imageUrl,
        link: newsItem.linkUrl,
        author: newsItem.author,
        status: newsItem.status,
        featured: newsItem.featured,
        tags: newsItem.tags ? JSON.parse(newsItem.tags) : [],
        publishDate: newsItem.publishDate?.toISOString().split('T')[0],
        expiryDate: newsItem.expiryDate?.toISOString().split('T')[0]
      }
    }
  }

  /**
   * Slider operations
   */
  static slider = {
    async findMany(tenantId: string, filters: any = {}) {
      const where = { tenantId, ...filters }
      return prisma.slider.findMany({ where })
    },

    async findById(tenantId: string, id: string) {
      return prisma.slider.findFirst({
        where: { id, tenantId }
      })
    },

    async create(tenantId: string, data: any) {
      return prisma.slider.create({
        data: { ...data, tenantId }
      })
    },

    async update(tenantId: string, id: string, data: any) {
      const existingSlider = await this.findById(tenantId, id)
      if (!existingSlider) {
        throw new Error('Slider not found')
      }
      
      return prisma.slider.update({
        where: { id },
        data
      })
    },

    async delete(tenantId: string, id: string) {
      const existingSlider = await this.findById(tenantId, id)
      if (!existingSlider) {
        throw new Error('Slider not found')
      }
      
      return prisma.slider.delete({
        where: { id }
      })
    }
  }

  /**
   * Generic operations
   */
  static async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  static async getStats(tenantId: string) {
    const [galleries, menus, news, sliders] = await Promise.all([
      prisma.gallery.count({ where: { tenantId } }),
      prisma.menu.count({ where: { tenantId } }),
      prisma.newsItem.count({ where: { tenantId } }),
      prisma.slider.count({ where: { tenantId } })
    ])

    return {
      galleries,
      menus,
      news,
      sliders,
      total: galleries + menus + news + sliders
    }
  }

  /**
   * Bulk operations
   */
  static async bulkDelete(tenantId: string, model: 'gallery' | 'menu' | 'newsItem' | 'slider', ids: string[]) {
    const where = {
      tenantId,
      id: { in: ids }
    }

    switch (model) {
      case 'gallery':
        return prisma.gallery.deleteMany({ where })
      case 'menu':
        return prisma.menu.deleteMany({ where })
      case 'newsItem':
        return prisma.newsItem.deleteMany({ where })
      case 'slider':
        return prisma.slider.deleteMany({ where })
      default:
        throw new Error(`Invalid model: ${model}`)
    }
  }

  /**
   * Search operations
   */
  static async globalSearch(tenantId: string, query: string) {
    const searchTerm = query.toLowerCase()

    const [galleries, menus, news, sliders] = await Promise.all([
      prisma.gallery.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { shortcode: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      prisma.menu.findMany({
        where: {
          tenantId,
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: 5
      }),
      prisma.newsItem.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      prisma.slider.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    ])

    return {
      galleries: galleries.map(g => ({ ...g, type: 'gallery' })),
      menus: menus.map(m => ({ ...m, type: 'menu' })),
      news: news.map(n => ({ ...n, type: 'news' })),
      sliders: sliders.map(s => ({ ...s, type: 'slider' })),
      total: galleries.length + menus.length + news.length + sliders.length
    }
  }
}

export default DatabaseHelpers
