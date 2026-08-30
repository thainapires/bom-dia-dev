import { GoPlus } from "react-icons/go";
import { Button } from "../ui";

interface NewNoteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NewNoteButton({ onClick, disabled = false }: NewNoteButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Só é possível criar notas para hoje" : undefined}
      variant="primary"
      icon={<GoPlus size={16} className="stroke-1" />}
    >
      Nova nota
    </Button>
  );
}
