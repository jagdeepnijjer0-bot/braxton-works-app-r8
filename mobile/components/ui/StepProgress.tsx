import { View, Text } from "react-native";
import { colors } from "@/lib/colors";

interface Props {
  step:   number;
  total?: number;
}

export function StepProgress({ step, total = 4 }: Props) {
  const pct = (step / total) * 100;
  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ color: colors.amber, fontWeight: "800", fontSize: 12, letterSpacing: 0.5 }}>
          STEP {step} OF {total}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: "600" }}>
          {Math.round(pct)}% complete
        </Text>
      </View>
      <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
        <View
          style={{
            height:          3,
            width:           `${pct}%`,
            backgroundColor: colors.amber,
            borderRadius:    3,
            shadowColor:     colors.amber,
            shadowOpacity:   0.6,
            shadowRadius:    6,
            shadowOffset:    { width: 0, height: 0 },
          }}
        />
      </View>
    </View>
  );
}
