
import ModuleScreen from "../../src/components/ModuleScreen";
import { useTheme } from "../../src/styles/ThemeContext";

export default function FitnessScreen() {
  const { colors } = useTheme();

  return (
    <ModuleScreen
      title="Entrenamiento"
      description="Gestiona tus rutinas y registra tus sesiones."
      icon="barbell"
      color={colors.fitness}
    />
  );
}
