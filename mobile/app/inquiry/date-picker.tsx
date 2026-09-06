import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export default function DatePickerScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();

  const today = new Date();
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(inquiry.chosenDate ?? null);

  const cells = buildCalendar(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else             { setMonth((m) => m - 1); }
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else              { setMonth((m) => m + 1); }
  };

  const handleConfirm = () => {
    if (!selected) return;
    setInquiry({ ...inquiry, chosenDate: selected });
    router.push("/inquiry/contact");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={3} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Choose a{"\n"}date</Text>
        <Text style={styles.sub}>When would you like the work done?</Text>

        {/* Month navigation */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthBtn} activeOpacity={0.7}>
            <ChevronLeft color={colors.amber} size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthBtn} activeOpacity={0.7}>
            <ChevronRight color={colors.amber} size={22} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View style={styles.grid}>
          {DAY_LABELS.map((d) => (
            <View key={d} style={styles.cell}>
              <Text style={styles.dayHeader}>{d}</Text>
            </View>
          ))}

          {cells.map((day, i) => {
            if (day === null) return <View key={`e-${i}`} style={styles.cell} />;

            const iso       = toISODate(year, month, day);
            const isPast    = iso < todayISO;
            const isToday   = iso === todayISO;
            const isSel     = iso === selected;

            return (
              <TouchableOpacity
                key={iso}
                style={styles.cell}
                onPress={() => !isPast && setSelected(iso)}
                activeOpacity={isPast ? 1 : 0.75}
                disabled={isPast}
              >
                <View style={[
                  styles.dayInner,
                  isToday && !isSel && styles.dayToday,
                  isSel && styles.daySelected,
                ]}>
                  <Text style={[
                    styles.dayText,
                    isPast && styles.dayPast,
                    isToday && !isSel && styles.dayTodayText,
                    isSel && styles.daySelectedText,
                  ]}>
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selected && (
          <Text style={styles.selectedLabel}>Selected: {formatDisplay(selected)}</Text>
        )}

        <Button
          label="Confirm Date"
          onPress={handleConfirm}
          disabled={!selected}
          style={{ marginTop: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.navy },
  back:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:  { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  content:   { flex: 1, paddingHorizontal: 22, paddingTop: 20 },
  title:     { color: colors.white, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  sub:       { color: colors.muted, fontSize: 15, fontWeight: "400", lineHeight: 22, marginBottom: 24 },

  monthRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  monthBtn:   { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.07)" },
  monthLabel: { color: colors.white, fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },

  grid:     { flexDirection: "row", flexWrap: "wrap" },
  cell:     { width: `${100 / 7}%`, alignItems: "center", marginBottom: 4 },

  dayHeader:  { color: colors.muted, fontSize: 12, fontWeight: "600", paddingVertical: 6 },

  dayInner:   {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: "center", justifyContent: "center",
  },
  dayText:    { color: colors.white, fontSize: 15, fontWeight: "500" },
  dayPast:    { color: "rgba(255,255,255,0.2)" },

  dayToday:     { backgroundColor: "rgba(245,158,11,0.15)" },
  dayTodayText: { color: colors.amber, fontWeight: "700" },

  daySelected:     { backgroundColor: colors.amber },
  daySelectedText: { color: colors.navy, fontWeight: "800" },

  selectedLabel: {
    color: colors.amber, fontSize: 14, fontWeight: "600",
    textAlign: "center", marginTop: 12,
  },
});
