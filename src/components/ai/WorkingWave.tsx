import { Text } from "@mantine/core";

export default function WorkingWave() {
  return (
    <Text component="span" size="sm" c="dimmed">
      {"Working...".split("").map((char, index) => (
        <Text
          key={`${char}-${index}`}
          component="span"
          size="sm"
          c="dimmed"
          style={{
            display: "inline-block",
            animation: "workingPulse 1.1s ease-in-out infinite",
            animationDelay: `${index * 0.06}s`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </Text>
      ))}
      <style>{`
        @keyframes workingPulse {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-1px); }
        }
      `}</style>
    </Text>
  );
}
