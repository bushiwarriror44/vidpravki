import { create } from "zustand";

const GlobalStore = create((set) => ({
  isMobile: window.innerWidth < 1025,
  settings: null,
  isLoading: false,
  error: null,
  isShowOverlay: false,
  overlayOnClick: null,

  setIsMobile: (isMobile) => set({ isMobile }),

  setIsShowOverlay: (value) => set({ isShowOverlay: value }),

  setOverlayOnClick: (callback) => set({ overlayOnClick: callback }),

  resetOverlay: () => set({ isShowOverlay: false, overlayOnClick: null }),

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/get_settings");
      if (!response.ok) {
        throw new Error("Ошибка при получении настроек");
      }
      const data = await response.json();
      set({ settings: data, isLoading: false, error: null });
    } catch (error) {
      console.error("Ошибка при загрузке настроек:", error);
      set({ error: error.message, isLoading: false });
    }
  },
}));

const handleResize = () => {
  const isMobile = window.innerWidth < 1025;
  GlobalStore.getState().setIsMobile(isMobile);
};

window.addEventListener("resize", handleResize);

export default GlobalStore;
