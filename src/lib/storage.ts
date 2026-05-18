import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(key);
      }
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    }
  },
};
