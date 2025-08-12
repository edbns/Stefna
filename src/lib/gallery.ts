import { useUserMediaStore } from "../stores/userMedia";

type MediaItem = {
  id: string;
  url: string;
  type: "photo" | "video";
  prompt?: string;
  meta?: any;
  createdAt?: string;
  kind?: string;
};

export const addToGallery = (item: MediaItem) => {
  useUserMediaStore.getState().add(item);
};

export const clearGallery = () => {
  useUserMediaStore.getState().clear();
};

export const removeFromGallery = (id: string) => {
  useUserMediaStore.getState().remove(id);
};
