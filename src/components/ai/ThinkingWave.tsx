import { Text } from "@mantine/core";

export default function ThinkingWave() {
  return (
    <Text component="span" size="sm" c="dimmed">
      {"Thinking...".split("").map((char, index) => (
        <Text
          key={`${char}-${index}`}
          component="span"
          size="sm"
          c="dimmed"
          style={{
            display: "inline-block",
            animation: "thinkingPulse 1.1s ease-in-out infinite",
            animationDelay: `${index * 0.06}s`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </Text>
      ))}
      <style>{`
        @keyframes thinkingPulse {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-1px); }
        }
      `}</style>
    </Text>
  );
}
