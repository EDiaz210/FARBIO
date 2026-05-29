import { create } from "zustand"
import { persist } from "zustand/middleware"

const storeAuth = create(
    persist(
        
        set => ({
            token: null,
            rol: null,
            user: null,
            setToken: (token) => set({ token }),
            setRol: (rol) => set({ rol }),
            setUser: (user) => set({ user }),
            logout: () => set({ token: null, rol: null, user: null, id: null }),

        }),

        { 
            name: "auth-session",
            partialize: (state) => ({
                token: state.token,
                rol: state.rol,
                user: state.user,
            })
        }
    
    )
)


export default storeAuth