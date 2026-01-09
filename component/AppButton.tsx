import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../constant/colors";


type Props = {
  title: string;
  onPress?: () => void;
};

export default function AppButton({ title, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  pressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.98 }], // subtle press effect
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
