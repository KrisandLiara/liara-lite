import { useState } from "react";
// import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";

export const useVoiceInput = (setInput: (value: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  // const { toast } = useToast();
  const { addNotification } = useNotifications();

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // toast({
      //   title: "Recording stopped",
      //   description: "Voice recording has been stopped.",
      // });
      addNotification("Voice recording has been stopped.", "info", "Recording Stopped");
    } else {
      setIsRecording(true);
      // toast({
      //   title: "Recording started",
      //   description: "Liara is listening...",
      // });
      addNotification("Liara is listening...", "info", "Recording Started");
      
      // Simulate speech recognition
      setTimeout(() => {
        setIsRecording(false);
        setInput("This is a simulated voice transcription. In the full implementation, this would use Web Speech API or a similar service.");
        // toast({
        //   title: "Recording processed",
        //   description: "Voice input transcribed successfully.",
        // });
        addNotification("Voice input transcribed successfully.", "success", "Recording Processed");
      }, 2000);
    }
  };

  return {
    isRecording,
    handleToggleRecording
  };
};
