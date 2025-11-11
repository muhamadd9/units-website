import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

interface ConfirmAlertProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmAlert = ({ title, message, onConfirm, onCancel }: ConfirmAlertProps) => {
  confirmAlert({
    title,
    message,
    buttons: [
      {
        label: "Yes",
        onClick: onConfirm,
      },
      {
        label: "No",
        onClick: onCancel || (() => {}),
      },
    ],
    closeOnEscape: true,
    closeOnClickOutside: true,
  });
};

export default ConfirmAlert;

