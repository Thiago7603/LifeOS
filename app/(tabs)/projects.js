import ModuleScreen from "../../src/components/common/ModuleScreen";
import { useTheme } from "../../src/styles/ThemeContext";

export default function ProjectsScreen() {
  const { colors } = useTheme();

  return (
    <ModuleScreen
      title="Mis proyectos"
      description="Organiza tus proyectos, tareas y objetivos."
      icon="folder-open"
      color={colors.project}
    />
  );
}
