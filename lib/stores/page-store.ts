import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface Page {
  id: string
  title: string
  slug: string
  data: any // Can be Puck data or GrapesJS data
  html?: string // For direct HTML import
  css?: string // For direct CSS import
  js?: string // For custom JavaScript
  builderType: 'puck' | 'grapesjs' | 'html'
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  metaTitle?: string
  metaDescription?: string
}

interface PageStore {
  pages: Page[]
  currentPage: Page | null
  isLoading: boolean
  
  // Actions
  setPages: (pages: Page[]) => void
  setCurrentPage: (page: Page | null) => void
  createPage: (title: string, slug: string, builderType?: 'puck' | 'grapesjs' | 'html') => Page
  createPageFromHTML: (title: string, slug: string, html: string, css?: string, js?: string) => Page
  updatePage: (id: string, updates: Partial<Page>) => void
  deletePage: (id: string) => void
  publishPage: (id: string) => void
  unpublishPage: (id: string) => void
  duplicatePage: (id: string) => Page
  savePageData: (id: string, data: any) => void
  savePageHTML: (id: string, html: string, css?: string, js?: string) => void
}

export const usePageStore = create<PageStore>()(
  persist(
    (set, get) => ({
      pages: [],
      currentPage: null,
      isLoading: false,

      setPages: (pages) => set({ pages }),
      
      setCurrentPage: (page) => {
        set((state) => {
          if (state.currentPage?.id === page?.id) {
            return state
          }
          return { currentPage: page }
        })
      },



      createPage: (title, slug, builderType = 'grapesjs') => {
        const newPage: Page = {
          id: uuidv4(),
          title,
          slug,
          data: builderType === 'puck' ? {
            content: [],
            root: { props: { title } }
          } : {},
          html: '',
          css: '',
          js: '',
          builderType,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        set((state) => ({
          pages: [...state.pages, newPage],
          currentPage: newPage
        }))

        return newPage
      },

      createPageFromHTML: (title, slug, html, css = '', js = '') => {
        const newPage: Page = {
          id: uuidv4(),
          title,
          slug,
          data: {},
          html,
          css,
          js,
          builderType: 'html',
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        set((state) => ({
          pages: [...state.pages, newPage],
          currentPage: newPage
        }))

        return newPage
      },

      updatePage: (id, updates) => {
        set((state) => {
          const updatedPages = state.pages.map(page => 
            page.id === id 
              ? { ...page, ...updates, updatedAt: new Date() }
              : page
          )
          
          const updatedCurrentPage = state.currentPage?.id === id 
            ? { ...state.currentPage, ...updates, updatedAt: new Date() }
            : state.currentPage

          return {
            pages: updatedPages,
            currentPage: updatedCurrentPage
          }
        })
      },

      deletePage: (id) => {
        set((state) => ({
          pages: state.pages.filter(page => page.id !== id),
          currentPage: state.currentPage?.id === id ? null : state.currentPage
        }))
      },

      publishPage: (id) => {
        console.log('Publishing page:', id)
        const state = get()
        const page = state.pages.find(p => p.id === id)
        
        if (page) {
          state.updatePage(id, { isPublished: true })
          console.log('Page published successfully:', page.title)
          
          // Trigger a re-render to update UI
          set((currentState) => ({
            ...currentState,
            pages: currentState.pages.map(p =>
              p.id === id ? { ...p, isPublished: true, updatedAt: new Date() } : p
            )
          }))
        }
      },

      unpublishPage: (id) => {
        console.log('Unpublishing page:', id)
        get().updatePage(id, { isPublished: false })
      },

      duplicatePage: (id) => {
        const originalPage = get().pages.find(page => page.id === id)
        if (!originalPage) throw new Error('Page not found')

        const duplicatedPage: Page = {
          ...originalPage,
          id: uuidv4(),
          title: `${originalPage.title} (Copy)`,
          slug: `${originalPage.slug}-copy-${Date.now()}`,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        set((state) => ({
          pages: [...state.pages, duplicatedPage]
        }))

        return duplicatedPage
      },

      savePageData: (id, data) => {
        console.log('Saving page data:', id, data)
        get().updatePage(id, { data })
      },

      savePageHTML: (id, html, css = '', js = '') => {
        console.log('Saving page HTML:', id, {
          htmlLength: html.length,
          cssLength: css.length,
          jsLength: js.length
        })

        const state = get()
        const page = state.pages.find(p => p.id === id)

        if (!page) {
          console.error('Page not found for saving:', id)
          throw new Error('Page not found')
        }

        // Update the page
        state.updatePage(id, { html, css, js, builderType: 'html' })

        console.log('Page HTML saved successfully:', {
          pageId: id,
          title: page.title
        })
      }
    }),
    {
      name: 'page-store', // unique name for localStorage
      partialize: (state) => ({ pages: state.pages }), // only persist pages
      // Transform dates on storage/retrieval
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        if (parsed.state?.pages) {
          parsed.state.pages = parsed.state.pages.map((page: any) => ({
            ...page,
            createdAt: new Date(page.createdAt),
            updatedAt: new Date(page.updatedAt)
          }))
        }
        return parsed
      }
    }
  )
)
