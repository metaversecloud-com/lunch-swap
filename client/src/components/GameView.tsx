import { useContext, useState } from "react";
import { GlobalStateContext } from "@/context/GlobalContext";
import { NewDayWelcome } from "@/components/NewDayWelcome";
import { CompletionSummary } from "@/components/CompletionSummary";
import { MainGameView } from "@/components/MainGameView";

export const GameView = () => {
  const { isNewDay, completedToday } = useContext(GlobalStateContext);
  const [dismissed, setDismissed] = useState(false);

  if (isNewDay && !dismissed) {
    return <NewDayWelcome onDismiss={() => setDismissed(true)} />;
  }

  if (completedToday) {
    return <CompletionSummary />;
  }

  return <MainGameView />;
};
