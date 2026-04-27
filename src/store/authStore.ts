import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, type MsProfile } from '../lib/supabase'

interface AuthState {
  profile: MsProfile | null
  loading: boolean
  setProfile: (profile: MsProfile | null) => void
  setLoading: (v: boolean) => void
  loadUserData: (silent?: boolean) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      loading: true,

      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      loadUserData: async (silent = false) => {
        if (!silent) set({ loading: true })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ profile: null, loading: false })
            return
          }

          const { data: profile } = await supabase
            .from('ms_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!profile) {
            set({ profile: null, loading: false })
            return
          }

          set({ profile, loading: false })
        } catch {
          set({ profile: null, loading: false })
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ profile: null })
      },
    }),
    {
      name: 'mansole-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
