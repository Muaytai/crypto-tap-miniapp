import { TapGame } from "@/components/TapGame";

export default function Home() {
  return (
    <div className="flex min-h-dvh w-full min-w-0 max-w-[100vw] flex-1 flex-col items-stretch">
      <TapGame />
    </div>
  );
}
