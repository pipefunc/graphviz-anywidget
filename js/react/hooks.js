// js/react/hooks.js
import { useModel } from "@anywidget/react";

export function useCustomHook() {
    const model = useModel();

    const resetZoom = () => {
        model.send({ action: "reset_zoom" });
    };

    const sendSearchQuery = (query) => {
        model.send({ action: "search", query });
    };

    return { resetZoom, sendSearchQuery };
}
