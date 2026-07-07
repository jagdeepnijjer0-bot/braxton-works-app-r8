import { View, Text } from "react-native";
import { colors } from "@/lib/colors";

interface Props {
  step:  number;
  total?: number;
}

export function StepProgress({ step, total = 4 }: Props) {
  const pct = (step / total) * 100;
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 }}>
      <Text style={{ color: colors.amber, fontWeight: "600", fontSize: 13, marginBottom: 8 }}>
        Step {step} of {total}
      </Text>
      <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 4 }}>
        <View
          style={{
            height: 4,
            width: `${pct}%`,
            backgroundColor: colors.amber,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}
