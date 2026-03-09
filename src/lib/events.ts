
type Callback = () => void;
const listeners: Set<Callback> = new Set();
const authListeners: Set<Callback> = new Set();

export const wardrobeEvents = {
    subscribe(callback: Callback) {
        listeners.add(callback);
        return () => listeners.delete(callback);
    },
    emit() {
        listeners.forEach(callback => callback());
    }
};

export const authEvents = {
    subscribe(callback: Callback) {
        authListeners.add(callback);
        return () => authListeners.delete(callback);
    },
    emit() {
        authListeners.forEach(callback => callback());
    }
};
