import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../style/alert.css";
import {
  faCircleCheck,
  faCircleExclamation,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

interface AlertProps {
  type?: "success" | "error" | "warning";
  message: any;
  onClose?: () => void;
}

const Alerts = ({ type = "success", message, onClose }: AlertProps) => {
  const icons = {
    success: faCircleCheck,
    error: faCircleExclamation,
    warning: faTriangleExclamation,
  };

  return (
    <div className="alert-container">
      <div className={`alert-box ${type}`} role="alert">
        <FontAwesomeIcon icon={icons[type]} className="alert-icon" />

        <p className="alert-message">{message}</p>

        {onClose && (
          <button
            className="alert-close"
            onClick={onClose}
            aria-label="Close alert"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alerts;
