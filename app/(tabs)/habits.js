
import ModuleScreen from "../../src/components/ModuleScreen";
import { useTheme } from "../../src/styles/ThemeContext";

export default function HabitsScreen() {
  const { colors } = useTheme();

  return (
    <ModuleScreen
      title="Mis hábitos"
      description="Construye rutinas y sigue tu progreso."
      icon="checkmark-circle"
      color={colors.success}
    />
  );
}
