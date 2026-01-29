import { useAppContext } from "../context";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Select, type SelectOption } from "./ui/select";

export function EnvironmentSelector() {
  const { state, setSourceEnv, setTargetEnv } = useAppContext();

  const environmentOptions: SelectOption[] = state.environments.map((env) => ({
    value: env.sys.id,
    label: env.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Selection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Source Environment (From)"
            options={environmentOptions}
            placeholder="Select source"
            value={state.sourceEnvironment || ""}
            onChange={(e) => setSourceEnv(e.target.value)}
          />
          <Select
            label="Target Environment (To)"
            options={environmentOptions}
            placeholder="Select target"
            value={state.targetEnvironment || ""}
            onChange={(e) => setTargetEnv(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
