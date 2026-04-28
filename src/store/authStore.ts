import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'
import type { MsProfile } from '../lib/types'

interface AuthState {
  profile: MsProfile | null
  loading: boolean
  setProfile: (profile: MsProfile | null) => void
  setLoading: (v: boolean) => void
  loadUserData: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      loading: true,

      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      loadUserData: async () => {
        set({ loading: true })
        try {
          const { data: profile } = await api.auth.me()
          set({ profile, loading: false })
        } catch {
          set({ profile: null, loading: false })
        }
      },

      signOut: async () => {
        await api.auth.logout()
        set({ profile: null })
      },
    }),
    {
      name: 'mansole-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
