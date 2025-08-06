import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface MenuItem {
  id: string
  label: string
  url: string
  type: 'page' | 'external' | 'custom'
  pageId?: string // Reference to page ID if type is 'page'
  target?: '_blank' | '_self'
  children?: MenuItem[]
  order: number
  isVisible: boolean
}

export interface Menu {
  id: string
  name: string
  location: string
  items: MenuItem[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface MenuStore {
  menus: Menu[]
  currentMenu: Menu | null
  isLoading: boolean
  
  // Actions
  setMenus: (menus: Menu[]) => void
  setCurrentMenu: (menu: Menu | null) => void
  createMenu: (name: string, location: string) => Menu
  updateMenu: (id: string, updates: Partial<Menu>) => void
  deleteMenu: (id: string) => void
  addMenuItem: (menuId: string, item: Omit<MenuItem, 'id' | 'order'>, parentId?: string) => void
  updateMenuItem: (menuId: string, itemId: string, updates: Partial<MenuItem>) => void
  deleteMenuItem: (menuId: string, itemId: string) => void
  reorderMenuItems: (menuId: string, items: MenuItem[]) => void
  getMenuByLocation: (location: string) => Menu | undefined
  refreshStore: () => void
}

// Helper function to find and update menu item recursively
const updateMenuItemRecursive = (items: MenuItem[], itemId: string, updates: Partial<MenuItem>): MenuItem[] => {
  return items.map(item => {
    if (item.id === itemId) {
      return { ...item, ...updates }
    }
    if (item.children) {
      return {
        ...item,
        children: updateMenuItemRecursive(item.children, itemId, updates)
      }
    }
    return item
  })
}

// Helper function to delete menu item recursively
const deleteMenuItemRecursive = (items: MenuItem[], itemId: string): MenuItem[] => {
  return items.filter(item => {
    if (item.id === itemId) {
      return false
    }
    if (item.children) {
      item.children = deleteMenuItemRecursive(item.children, itemId)
    }
    return true
  })
}

// Helper function to add menu item
const addMenuItemToParent = (items: MenuItem[], newItem: MenuItem, parentId?: string): MenuItem[] => {
  if (!parentId) {
    return [...items, newItem]
  }

  return items.map(item => {
    if (item.id === parentId) {
      return {
        ...item,
        children: [...(item.children || []), newItem]
      }
    }
    if (item.children) {
      return {
        ...item,
        children: addMenuItemToParent(item.children, newItem, parentId)
      }
    }
    return item
  })
}

// Initial sample data
const initialSampleMenu: Menu = {
  id: 'sample-1',
  name: 'Main Navigation',
  location: 'header',
  items: [
    {
      id: 'home',
      label: 'Home',
      url: '/',
      type: 'page',
      target: '_self',
      order: 1,
      isVisible: true
    },
    {
      id: 'about',
      label: 'About',
      url: '/about',
      type: 'page',
      target: '_self',
      order: 2,
      isVisible: true,
      children: [
        {
          id: 'about-history',
          label: 'Our History',
          url: '/about/history',
          type: 'page',
          target: '_self',
          order: 1,
          isVisible: true
        },
        {
          id: 'about-mission',
          label: 'Mission & Vision',
          url: '/about/mission',
          type: 'page',
          target: '_self',
          order: 2,
          isVisible: true
        }
      ]
    },
    {
      id: 'departments',
      label: 'Departments',
      url: '/departments',
      type: 'page',
      target: '_self',
      order: 3,
      isVisible: true,
      children: [
        {
          id: 'dept-cs',
          label: 'Computer Science',
          url: '/departments/computer-science',
          type: 'page',
          target: '_self',
          order: 1,
          isVisible: true
        },
        {
          id: 'dept-math',
          label: 'Mathematics',
          url: '/departments/mathematics',
          type: 'page',
          target: '_self',
          order: 2,
          isVisible: true
        }
      ]
    },
    {
      id: 'admissions',
      label: 'Admissions',
      url: '/admissions',
      type: 'page',
      target: '_self',
      order: 4,
      isVisible: true,
      children: [
        {
          id: 'admission-process',
          label: 'Admission Process',
          url: '/admissions/process',
          type: 'page',
          target: '_self',
          order: 1,
          isVisible: true
        },
        {
          id: 'admission-fees',
          label: 'Fee Structure',
          url: '/admissions/fees',
          type: 'page',
          target: '_self',
          order: 2,
          isVisible: true
        }
      ]
    },
    {
      id: 'contact',
      label: 'Contact Us',
      url: '/contact',
      type: 'page',
      target: '_self',
      order: 5,
      isVisible: true
    }
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      menus: [],
      currentMenu: null,
      isLoading: false,

      setMenus: (menus) => set({ menus }),
      
      setCurrentMenu: (menu) => set({ currentMenu: menu }),

      createMenu: (name, location) => {
        const newMenu: Menu = {
          id: uuidv4(),
          name,
          location,
          items: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        set((state) => {
          const updatedMenus = [...state.menus, newMenu]
          return {
            menus: updatedMenus,
            currentMenu: newMenu
          }
        })

        return newMenu
      },

      updateMenu: (id, updates) => {
        set((state) => {
          const updatedMenus = state.menus.map(menu => 
            menu.id === id 
              ? { ...menu, ...updates, updatedAt: new Date() }
              : menu
          )
          
          const updatedCurrentMenu = state.currentMenu?.id === id 
            ? { ...state.currentMenu, ...updates, updatedAt: new Date() }
            : state.currentMenu

          return {
            menus: updatedMenus,
            currentMenu: updatedCurrentMenu
          }
        })
      },

      deleteMenu: (id) => {
        set((state) => ({
          menus: state.menus.filter(menu => menu.id !== id),
          currentMenu: state.currentMenu?.id === id ? null : state.currentMenu
        }))
      },

      addMenuItem: (menuId, item, parentId) => {
        const newItem: MenuItem = {
          ...item,
          id: uuidv4(),
          order: Date.now() // Simple ordering based on creation time
        }

        set((state) => {
          const updatedMenus = state.menus.map(menu => {
            if (menu.id === menuId) {
              const updatedMenu = {
                ...menu,
                items: addMenuItemToParent(menu.items, newItem, parentId),
                updatedAt: new Date()
              }
              return updatedMenu
            }
            return menu
          })

          // Update currentMenu separately to ensure it reflects the changes
          const updatedCurrentMenu = state.currentMenu?.id === menuId
            ? updatedMenus.find(m => m.id === menuId) || state.currentMenu
            : state.currentMenu

          return {
            menus: updatedMenus,
            currentMenu: updatedCurrentMenu
          }
        })
      },

      updateMenuItem: (menuId, itemId, updates) => {
        set((state) => {
          const updatedMenus = state.menus.map(menu => {
            if (menu.id === menuId) {
              const updatedMenu = {
                ...menu,
                items: updateMenuItemRecursive(menu.items, itemId, updates),
                updatedAt: new Date()
              }
              // Also update currentMenu if it's the same menu
              if (state.currentMenu?.id === menuId) {
                set({ currentMenu: updatedMenu })
              }
              return updatedMenu
            }
            return menu
          })

          return { menus: updatedMenus }
        })
      },

      deleteMenuItem: (menuId, itemId) => {
        set((state) => {
          const updatedMenus = state.menus.map(menu => {
            if (menu.id === menuId) {
              const updatedMenu = {
                ...menu,
                items: deleteMenuItemRecursive(menu.items, itemId),
                updatedAt: new Date()
              }
              // Also update currentMenu if it's the same menu
              if (state.currentMenu?.id === menuId) {
                set({ currentMenu: updatedMenu })
              }
              return updatedMenu
            }
            return menu
          })

          return { menus: updatedMenus }
        })
      },

      reorderMenuItems: (menuId, items) => {
        set((state) => {
          const updatedMenus = state.menus.map(menu => {
            if (menu.id === menuId) {
              const updatedMenu = {
                ...menu,
                items,
                updatedAt: new Date()
              }
              // Also update currentMenu if it's the same menu
              if (state.currentMenu?.id === menuId) {
                set({ currentMenu: updatedMenu })
              }
              return updatedMenu
            }
            return menu
          })

          return { menus: updatedMenus }
        })
      },

      getMenuByLocation: (location) => {
        return get().menus.find(menu => menu.location === location && menu.isActive)
      },

      refreshStore: () => {
        const state = get()
        // Trigger a re-render by setting the same state
        set({ ...state })
      }
    }),
    {
      name: 'menu-store',
      partialize: (state) => ({ menus: state.menus }),
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => {
        try {
          const parsed = JSON.parse(str)
          if (parsed.state?.menus) {
            parsed.state.menus = parsed.state.menus.map((menu: any) => ({
              ...menu,
              createdAt: new Date(menu.createdAt),
              updatedAt: new Date(menu.updatedAt)
            }))
          }
          return parsed
        } catch (error) {
          // Return empty state if parsing fails
          return { state: { menus: [] } }
        }
      },
      onRehydrateStorage: () => (state) => {
        // Initialize with sample data if no menus exist
        if (state && state.menus.length === 0) {
          state.menus = [initialSampleMenu]
          state.currentMenu = initialSampleMenu
        }
      },
      skipHydration: false
    }
  )
)
