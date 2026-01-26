import React from "react";
import '../style/alert.css'

interface AlertProps {
  type?: "success" | "error" | "warning";
  message: React.ReactNode;
  onClose?: () => void;
}

const Alerts = ({ message, onClose }: AlertProps) => {
  return (
    <div className="alert-overlay">
      <div className="alert-modal">
        <div className="alert-message">{message}</div>

        {onClose && (
          <div className="alert-buttons">
            <button className="btn-clear" onClick={onClose}>Cancel</button>
            <button className="btn-submit" onClick={onClose}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
