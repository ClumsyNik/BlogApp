import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Props {
  onClick?: () => void;
  children?: string | number | React.ReactNode;
  icon?: IconProp | string;
  className?: string;
  element?: React.ReactNode;
  style?: any;
  colorVariant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "light"
    | "dark"
    | "link"
    | "danger";
  type?: "button" | "submit" | "reset";
}

const Button = ({
  onClick,
  children,
  icon,
  colorVariant = "primary",
  className = "",
  element,
  type = "button",
}: Props) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn btn-${colorVariant} d-flex align-items-center gap-2 ${className}`}
    >
      {icon &&
        (typeof icon === "string" ? (
          <img src={icon} alt="" width={20} height={20} />
        ) : (
          <FontAwesomeIcon icon={icon} />
        ))}

      <span>{children}</span>

      {element}
    </button>
  );
};

export default Button;
