import { useUserMediaStore } from "../stores/userMedia";
export const addToGallery = (item) => {
    useUserMediaStore.getState().add(item);
};
export const clearGallery = () => {
    useUserMediaStore.getState().clear();
};
export const removeFromGallery = (id) => {
    useUserMediaStore.getState().remove(id);
};
