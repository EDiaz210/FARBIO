import { create } from "zustand"
import { persist } from "zustand/middleware"

const storeAuth = create(
    persist(
        set => ({
            token: null,
            setToken: (token) => set({ token }),
            logout: () => set({ token: null }),

        }),

        { 
            name: "auth-session",
            partialize: (state) => ({
                token: state.token,
            })
        }
    )
)


export default storeAuth