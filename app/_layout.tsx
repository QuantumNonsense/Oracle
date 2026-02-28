import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { ...styles.content, flex: 1, width: "100%" },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
  header: {
    backgroundColor: "#11110f",
  },
  headerTitle: {
    fontFamily: "MilongaRegular",
    fontWeight: "600",
    fontSize: 18,
  },
  content: {
    backgroundColor: "transparent",
  },
});
