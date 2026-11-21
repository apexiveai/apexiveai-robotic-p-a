
import type { JsonValue } from "../../types/workflow";
import {
  createLoopState,
  stepLoop,
  type LoopDefinition,
} from "./loopManager";

const definition: LoopDefinition = {
  id: "loop-example-001",
  kind: "for-each",
  items: ["Yangon", "Mandalay", "Naypyidaw"],
  itemVariable: "city",
  indexVariable: "position",
  maxIterations: 100,
};

let state = createLoopState(definition);

const workflowVariables: Record<string, JsonValue> = {};

while (true) {
  const result = stepLoop(state, workflowVariables);

  state = result.state;

  if (result.action === "completed") {
    console.log("Loop completed.");
    break;
  }

  if (result.action === "failed") {
    console.error(result.error);
    break;
  }

  console.log({
    iteration: result.iteration,
    city: result.variables.city,
    position: result.variables.position,
  });
}
